import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { execSync, execFile } from "child_process";
import { invalidateCache } from "./src/lib/kanban/reader";

const KANBAN_ROOT = process.env.KANBAN_ROOT || "/home/carlosfarah/kanbania";
const PORT = parseInt(process.env.WS_PORT || "8766", 10);
const GITLAB_WEBHOOK_SECRET = process.env.GITLAB_WEBHOOK_SECRET || "";
const SCRIPTS_DIR = path.join(KANBAN_ROOT, "scripts");

// ── Deduplication: track processed pipeline IDs (TTL 1h) ───────────────────
const processedPipelines = new Map<number, number>();

function cleanupProcessedPipelines() {
  const now = Date.now();
  processedPipelines.forEach((ts, id) => {
    if (now - ts > 3_600_000) processedPipelines.delete(id);
  });
}
setInterval(cleanupProcessedPipelines, 300_000);

// ── HTTP server + webhook ──────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

async function handleGitlabWebhook(req: http.IncomingMessage, res: http.ServerResponse) {
  // Validate secret token
  const token = req.headers["x-gitlab-token"] as string | undefined;
  if (GITLAB_WEBHOOK_SECRET && token !== GITLAB_WEBHOOK_SECRET) {
    console.log("[WEBHOOK] Rejected: invalid X-Gitlab-Token");
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readBody(req);
    const payload = JSON.parse(body);

    // Only process pipeline failures on main
    if (
      payload.object_kind !== "pipeline" ||
      payload.object_attributes?.status !== "failed" ||
      payload.object_attributes?.ref !== "main"
    ) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ignored", reason: "not a main pipeline failure" }));
      return;
    }

    const pipelineId = payload.object_attributes.id as number;
    const pipelineUrl = payload.object_attributes.url as string || `${payload.project?.web_url || ""}/-/pipelines/${pipelineId}`;
    const commitSha = payload.commit?.id || payload.object_attributes?.sha || "unknown";

    // Dedup check
    if (processedPipelines.has(pipelineId)) {
      console.log(`[WEBHOOK] Pipeline #${pipelineId} already processed, skipping`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "duplicate", pipeline_id: pipelineId }));
      return;
    }
    processedPipelines.set(pipelineId, Date.now());

    console.log(`[WEBHOOK] Pipeline #${pipelineId} failed on main — processing...`);

    // Find failed jobs
    const failedJobs: Array<{ id: number; name: string }> = [];
    if (Array.isArray(payload.builds)) {
      for (const build of payload.builds) {
        if (build.status === "failed") {
          failedJobs.push({ id: build.id, name: build.name || "unknown" });
        }
      }
    }

    if (failedJobs.length === 0) {
      console.log(`[WEBHOOK] No failed jobs found in pipeline #${pipelineId}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "no_failed_jobs", pipeline_id: pipelineId }));
      return;
    }

    // Process first failed job (primary failure)
    const job = failedJobs[0];
    console.log(`[WEBHOOK] Analyzing failed job: ${job.name} (#${job.id})`);

    // Run analyze script
    const analyzeScript = path.join(SCRIPTS_DIR, "cicd-analyze-error.sh");
    let analysisJson = '{"category":"unknown_error","summary":"Could not analyze","job_name":"unknown"}';

    try {
      analysisJson = execSync(`bash "${analyzeScript}" "${job.id}"`, {
        cwd: KANBAN_ROOT,
        timeout: 30_000,
        encoding: "utf-8",
        env: { ...process.env, PATH: process.env.PATH },
      }).trim();
    } catch (err) {
      console.error(`[WEBHOOK] Error analysis failed:`, err);
    }

    const analysis = JSON.parse(analysisJson);
    console.log(`[WEBHOOK] Error classified as: ${analysis.category}`);

    // Run create-task script (execFile with args array — no shell interpolation)
    const createScript = path.join(SCRIPTS_DIR, "cicd-create-task.sh");
    const errorContext = analysis.error_context || "";
    const projectName = (payload.project?.name || "unknown").toLowerCase();

    execFile(
      "bash",
      [
        createScript,
        String(pipelineId),
        String(analysis.job_name),
        String(analysis.category),
        String(analysis.summary),
        String(pipelineUrl),
        String(commitSha),
        String(projectName),
        String(errorContext),
      ],
      {
        cwd: KANBAN_ROOT,
        timeout: 60_000,
        env: { ...process.env, PATH: process.env.PATH },
      },
      (err, stdout, stderr) => {
        if (err) {
          console.error(`[WEBHOOK] Task creation failed:`, stderr);
          return;
        }
        const taskId = stdout.trim().split("\n").pop();
        console.log(`[WEBHOOK] Created task ${taskId} for pipeline #${pipelineId}`);

        // Broadcast WS event
        broadcast({
          type: "cicd-failure",
          pipeline_id: pipelineId,
          pipeline_url: pipelineUrl,
          task_id: taskId,
          error_category: analysis.category,
          job_name: analysis.job_name,
          commit_sha: commitSha,
        });
      },
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "processing", pipeline_id: pipelineId, job_id: job.id }));
  } catch (err) {
    console.error("[WEBHOOK] Error processing webhook:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || "/";
  const method = req.method || "GET";

  if (method === "POST" && url === "/webhook/gitlab") {
    return handleGitlabWebhook(req, res);
  }

  if (method === "POST" && url === "/events/hook") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

const httpServer = http.createServer(handleRequest);
const wss = new WebSocketServer({ server: httpServer });
httpServer.listen(PORT);

console.log(`[WS] HTTP + WebSocket server running on port ${PORT}`);

function getArea(filePath: string): string | null {
  const rel = path.relative(KANBAN_ROOT, filePath);
  if (rel.startsWith("archive/")) return "board";
  if (rel.startsWith("board/")) return "board";
  if (rel.startsWith("sprints/")) return "sprints";
  if (rel.startsWith("projects/")) return "projects";
  if (rel.startsWith("logs/")) return "logs";
  if (rel.startsWith("okrs/")) return "okrs";
  if (rel.startsWith("agents/")) return "agents";
  if (rel === "config.yaml") return "config";
  return null;
}

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

const watchPaths = [
  path.join(KANBAN_ROOT, "archive"),
  path.join(KANBAN_ROOT, "board"),
  path.join(KANBAN_ROOT, "sprints"),
  path.join(KANBAN_ROOT, "projects"),
  path.join(KANBAN_ROOT, "logs"),
  path.join(KANBAN_ROOT, "okrs"),
  path.join(KANBAN_ROOT, "agents"),
  path.join(KANBAN_ROOT, "config.yaml"),
];

const watcher = chokidar.watch(watchPaths, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
});

// ── Auto-close sprint detection ──────────────────────────────────────────────
let sprintCheckTimer: ReturnType<typeof setTimeout> | null = null;
let sprintCheckLock = false;

function checkSprintCompletion() {
  if (sprintCheckLock) return;
  sprintCheckLock = true;

  try {
    const currentPath = path.join(KANBAN_ROOT, "sprints", "current.md");
    if (!fs.existsSync(currentPath)) return;

    const content = fs.readFileSync(currentPath, "utf-8");
    const match = content.match(/\*\*Sprint ativa\*\*:\s*(sprint-\d+)/);
    if (!match) return;

    const sprintId = match[1];
    const sprintPath = path.join(KANBAN_ROOT, "sprints", `${sprintId}.md`);
    if (!fs.existsSync(sprintPath)) return;

    const sprintContent = fs.readFileSync(sprintPath, "utf-8");
    const projectMatch = sprintContent.match(/^project:\s*"?([^"\n]+)"?/m);
    if (!projectMatch) return;
    const project = projectMatch[1].trim();

    // Find all tasks assigned to this sprint
    const columns = ["backlog", "todo", "in-progress", "review"];
    let pendingTasks = 0;

    for (const col of columns) {
      const dir = path.join(KANBAN_ROOT, "board", col);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
      for (const f of files) {
        const taskContent = fs.readFileSync(path.join(dir, f), "utf-8");
        if (taskContent.includes(`sprint: ${sprintId}`) || taskContent.includes(`sprint: "${sprintId}"`)) {
          pendingTasks++;
        }
      }
    }

    if (pendingTasks === 0) {
      // All tasks are in done — check that there IS at least one task in done
      const doneDir = path.join(KANBAN_ROOT, "board", "done");
      if (!fs.existsSync(doneDir)) return;
      const doneFiles = fs.readdirSync(doneDir).filter((f) => f.endsWith(".md"));
      let doneTasks = 0;
      for (const f of doneFiles) {
        const taskContent = fs.readFileSync(path.join(doneDir, f), "utf-8");
        if (taskContent.includes(`sprint: ${sprintId}`) || taskContent.includes(`sprint: "${sprintId}"`)) {
          doneTasks++;
        }
      }

      if (doneTasks === 0) return;

      console.log(`[WS] Sprint ${sprintId} complete! All ${doneTasks} tasks in done. Triggering auto-close...`);

      const scriptPath = path.join(KANBAN_ROOT, "scripts", "auto-close-sprint.sh");
      if (fs.existsSync(scriptPath)) {
        try {
          const output = execSync(`bash "${scriptPath}" "${sprintId}" "${project}"`, {
            cwd: KANBAN_ROOT,
            timeout: 60_000,
            encoding: "utf-8",
          });
          console.log(`[WS] Auto-close output: ${output}`);
        } catch (err) {
          console.error(`[WS] Auto-close failed:`, err);
        }
      } else {
        console.log(`[WS] Script ${scriptPath} not found — skipping auto-close`);
      }
    }
  } catch (err) {
    console.error("[WS] Sprint check error:", err);
  } finally {
    sprintCheckLock = false;
  }
}

// ── Rework detection (codex rejection) ───────────────────────────────────────
const REWORK_LOG = path.join(KANBAN_ROOT, "logs", "rework-pending.jsonl");

function detectRework(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Check if this card was recently rejected by codex
    if (!content.includes("rejected_qa") && !content.includes("rejected")) return;

    const taskMatch = content.match(/^id:\s*"?(TASK-\d+)"?/m);
    const projectMatch = content.match(/^project:\s*"?([^"\n]+)"?/m);
    if (!taskMatch) return;

    const taskId = taskMatch[1];
    const project = projectMatch?.[1]?.trim() || "unknown";

    // Avoid duplicate entries: check if this task is already pending
    if (fs.existsSync(REWORK_LOG)) {
      const existing = fs.readFileSync(REWORK_LOG, "utf-8");
      if (existing.includes(`"task_id":"${taskId}"`)) return;
    }

    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      task_id: taskId,
      project,
      reason: "codex_rejection",
      status: "pending",
    });

    fs.appendFileSync(REWORK_LOG, entry + "\n");
    console.log(`[WS] Rework detected: ${taskId} (${project}) — added to rework queue`);

    // Broadcast rework event so dashboard can show it
    broadcast({
      type: "rework-pending",
      task_id: taskId,
      project,
    });
  } catch (err) {
    console.error("[WS] Rework detection error:", err);
  }
}

// ── Auto-trigger reviewer (chokidar → review/) ───────────────────────────────
let reviewTriggerTimer: ReturnType<typeof setTimeout> | null = null;

function triggerReview() {
  const triggerScript = path.join(SCRIPTS_DIR, "trigger-agent-review.sh");
  if (!fs.existsSync(triggerScript)) {
    console.log(`[WS] Review trigger: script not found — skipping`);
    return;
  }
  console.log(`[WS] Review trigger: selecting highest-priority task from queue`);
  execFile("bash", [triggerScript], {
    cwd: KANBAN_ROOT,
    timeout: 120_000,
    env: { ...process.env, PATH: process.env.PATH },
  }, (err, _stdout, stderr) => {
    if (err) {
      console.error(`[WS] Review trigger failed:`, stderr);
    } else {
      console.log(`[WS] Review trigger complete`);
    }
  });
}

watcher.on("all", (event, filePath) => {
  const area = getArea(filePath);
  if (!area) return;

  const wsEvent = event === "unlink" || event === "unlinkDir" ? "unlink" : event === "add" || event === "addDir" ? "add" : "change";

  console.log(`[WS] ${wsEvent} in ${area}: ${path.relative(KANBAN_ROOT, filePath)}`);

  // Invalidate reader cache on file changes
  if (area === "board") invalidateCache("allTasks");
  else if (area === "sprints") { invalidateCache("allSprints"); invalidateCache("currentSprint"); }
  else if (area === "projects") invalidateCache("allProjects");
  else if (area === "okrs") invalidateCache("allOKRs");

  broadcast({
    type: "file-change",
    path: path.relative(KANBAN_ROOT, filePath),
    event: wsEvent,
    area,
  });

  const rel = path.relative(KANBAN_ROOT, filePath);

  // Check sprint completion when files move to done/
  if (rel.startsWith("board/done/") && (event === "add" || event === "change")) {
    if (sprintCheckTimer) clearTimeout(sprintCheckTimer);
    sprintCheckTimer = setTimeout(checkSprintCompletion, 2000);
  }

  // Detect codex rejection (card entering in-progress/ with rejected_qa)
  if (rel.startsWith("board/in-progress/") && rel.endsWith(".md") && event === "add") {
    setTimeout(() => detectRework(path.join(KANBAN_ROOT, rel)), 1000);
  }

  // Auto-trigger reviewer when a card enters board/review/
  if (rel.startsWith("board/review/") && rel.endsWith(".md") && event === "add") {
    if (reviewTriggerTimer) clearTimeout(reviewTriggerTimer);
    reviewTriggerTimer = setTimeout(() => { triggerReview(); reviewTriggerTimer = null; }, 1000);
  }
});

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  ws.on("close", () => console.log("[WS] Client disconnected"));
});

process.on("SIGTERM", () => {
  console.log("[WS] Shutting down...");
  watcher.close();
  wss.close();
  httpServer.close();
  process.exit(0);
});
