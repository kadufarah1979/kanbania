export interface TokensByPhase {
  backlog?: number;
  todo?: number;
  in_progress?: number;
  review?: number;
  done?: number;
  [key: string]: number | undefined;
}

export type Priority = "critical" | "high" | "medium" | "low";

/** Open string type — accepts any column id from config */
export type BoardColumn = string;

/** Open string type — accepts any agent id from config */
export type AgentId = string;

/** Agent configuration entry from config.yaml */
export interface AgentConfig {
  id: string;
  name: string;
  provider: string;
  role: "implementer" | "reviewer" | "both" | "pm";
  color: string;
  exec_command: string | null;
  wip_limit?: number;
}

export interface ActedByEntry {
  agent: string;
  action: string;
  date: string;
}

export interface Task {
  id: string;
  version: number;
  title: string;
  project: string;
  subproject: string | null;
  sprint: string | null;
  okr: string | null;
  priority: Priority;
  labels: string[];
  story_points: number | null;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  review_requested_from: string[];
  depends_on: string[];
  blocks: string[];
  acted_by: ActedByEntry[];
  status: BoardColumn;
  content: string;
  tokens_used: number | null;
  tokens_by_phase: TokensByPhase | null;
}

export interface BoardData {
  backlog: Task[];
  todo: Task[];
  "in-progress": Task[];
  review: Task[];
  done: Task[];
  archived: Task[];
  [column: string]: Task[];
}

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

export interface OKR {
  id: string;
  period: string;
  objective: string;
  created_at: string;
  created_by: string;
  status: "active" | "pending" | "completed" | "cancelled";
  key_results: KeyResult[];
  acted_by: ActedByEntry[];
}

export interface Sprint {
  id: string;
  title: string;
  project: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: "planning" | "active" | "completed" | "cancelled" | "pending";
  capacity: number;
  created_by: string;
  okrs: string[];
  acted_by: ActedByEntry[];
  tasks?: Task[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repo: string;
  tech_stack: string[];
  status: "active" | "paused" | "completed" | "archived";
  created_at: string;
  created_by: string;
  content: string;
}

export interface Activity {
  timestamp: string;
  agent: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  project?: string;
}

export interface KanbanConfig {
  system: { name: string; language: string };
  owner: { name: string; timezone: string };
  agents: AgentConfig[];
  sprint: { duration_days: number; default_capacity: number; naming_pattern: string };
  board: { columns: { id: string; name: string; description: string }[] };
  priorities: { id: string; name: string; order: number }[];
  labels: string[];
  git?: { commit_prefix: string; auto_push: boolean };
  notifications?: { provider: string; settings: Record<string, string> };
}

export interface Stats {
  totalTasks: number;
  byStatus: Record<BoardColumn, number>;
  byPriority: Record<Priority, number>;
  byAgent: Record<string, number>;
  byProject: Record<string, number>;
  totalPoints: number;
  completedPoints: number;
  inProgressPoints: number;
}

export interface ProjectStat {
  total: number;
  byStatus: Record<string, number>;
  totalPoints: number;
  completedPoints: number;
  activeSprint: string | null;
}

export type WSMessage =
  | {
      type: "file-change";
      path: string;
      event: "add" | "change" | "unlink";
      area: "board" | "sprints" | "projects" | "logs" | "okrs" | "agents" | "config";
    }
  | ({ type: "hook-event" } & HookEvent)
  | ({ type: "hitl-request" } & HitlRequest)
  | { type: "hitl-resolved"; request_id: string; approved: boolean };

export type HookType =
  | "PreToolUse"
  | "PostToolUse"
  | "SessionStart"
  | "SessionEnd"
  | "Stop"
  | "Notification";

export interface HookEvent {
  agent_id: string;
  session_id: string;
  hook_type: HookType;
  tool_name?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface HitlRequest {
  request_id: string;
  agent_id: string;
  session_id: string;
  timestamp: string;
  prompt: string;
  context?: Record<string, unknown>;
  expires_at?: string;
}
