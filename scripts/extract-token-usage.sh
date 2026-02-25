#!/usr/bin/env bash
# extract-token-usage.sh — Extract token usage from Claude Code and Codex logs per task
#
# Scans JSONL session logs from both agents, correlates with TASK-IDs,
# and outputs token usage per task.
#
# Usage:
#   bash scripts/extract-token-usage.sh [--agent <id>] [--project <slug>] [--update-tasks]
#
# Options:
#   --agent <id>        Filter by agent: claude-code, codex, all (default: all)
#   --project <slug>    Filter by project (default: all)
#   --update-tasks      Write tokens_used to task frontmatter (additive — sums with existing)
#   --csv               Output CSV format
#   --summary           Show only totals

set -euo pipefail

KANBAN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_PROJECTS_DIR="$HOME/.claude/projects"
CODEX_SESSIONS_DIR="$HOME/.codex/sessions"
UPDATE_TASKS=false
CSV_MODE=false
SUMMARY_MODE=false
PROJECT_FILTER=""
AGENT_FILTER="all"

while [ $# -gt 0 ]; do
  case "$1" in
    --agent) AGENT_FILTER="$2"; shift ;;
    --project) PROJECT_FILTER="$2"; shift ;;
    --update-tasks) UPDATE_TASKS=true ;;
    --csv) CSV_MODE=true ;;
    --summary) SUMMARY_MODE=true ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
  shift
done

CLAUDE_DIR="$CLAUDE_PROJECTS_DIR" \
CODEX_DIR="$CODEX_SESSIONS_DIR" \
KANBAN="$KANBAN_DIR" \
PROJ_FILTER="$PROJECT_FILTER" \
AGENT="$AGENT_FILTER" \
DO_UPDATE="$UPDATE_TASKS" \
DO_CSV="$CSV_MODE" \
DO_SUMMARY="$SUMMARY_MODE" \
python3 << 'PYEOF'
import json
import os
import re
import glob
from collections import defaultdict
from datetime import datetime

claude_projects_dir = os.environ["CLAUDE_DIR"]
codex_sessions_dir = os.environ["CODEX_DIR"]
kanban_dir = os.environ["KANBAN"]
project_filter = os.environ.get("PROJ_FILTER", "")
agent_filter = os.environ.get("AGENT", "all")
update_tasks = os.environ.get("DO_UPDATE", "false") == "true"
csv_mode = os.environ.get("DO_CSV", "false") == "true"
summary_mode = os.environ.get("DO_SUMMARY", "false") == "true"

task_pattern = re.compile(r'TASK-\d{4}')

# ──────────────────────────────────────────────────────────────
# Phase timeline reconstruction
# ──────────────────────────────────────────────────────────────
PHASES = ["backlog", "todo", "in_progress", "review"]
PHASE_ALIASES = {
    "backlog": "backlog",
    "todo": "todo",
    "in-progress": "in_progress",
    "in_progress": "in_progress",
    "review": "review",
    "done": "done",
    "archived": "done",
}

def load_activity_log():
    """Load activity.jsonl indexed by task_id."""
    activity_by_task = defaultdict(list)
    log_path = os.path.join(kanban_dir, "logs", "activity.jsonl")
    if not os.path.isfile(log_path):
        return activity_by_task
    try:
        with open(log_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if entry.get("entity_type") == "task":
                    tid = entry.get("entity_id", "")
                    activity_by_task[tid].append(entry)
    except Exception:
        pass
    return activity_by_task

activity_by_task = load_activity_log()

def parse_move_phase(details):
    """Extract (from_phase, to_phase) from activity details text."""
    details_lower = details.lower() if details else ""
    # Pattern: "from X to Y", "X -> Y", "de X para Y"
    patterns = [
        r'from\s+(?:board/)?([\w-]+)\s+to\s+(?:board/)?([\w-]+)',
        r'(?:board/)?([\w-]+)\s*(?:->|→)\s*(?:board/)?([\w-]+)',
        r'de\s+(?:board/)?([\w-]+)\s+para\s+(?:board/)?([\w-]+)',
    ]
    for pat in patterns:
        m = re.search(pat, details_lower)
        if m:
            from_p = PHASE_ALIASES.get(m.group(1), None)
            to_p = PHASE_ALIASES.get(m.group(2), None)
            return (from_p, to_p)
    # Pattern: "Moved to X", "moved X -> review"
    m = re.search(r'moved?\s+(?:to\s+)?(?:board/)?([\w-]+)', details_lower)
    if m:
        to_p = PHASE_ALIASES.get(m.group(1), None)
        return (None, to_p)
    # Pattern: "back to X"
    m = re.search(r'back\s+to\s+(?:board/)?([\w-]+)', details_lower)
    if m:
        to_p = PHASE_ALIASES.get(m.group(1), None)
        return (None, to_p)
    return (None, None)

def parse_iso_ts(ts_str):
    """Parse ISO timestamp string to datetime, tolerant of various formats."""
    if not ts_str:
        return None
    try:
        # Strip quotes
        ts_str = ts_str.strip().strip('"').strip("'")
        # Handle timezone offset
        ts_str = re.sub(r'([+-]\d{2}):(\d{2})$', r'\1\2', ts_str)
        for fmt in [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
        ]:
            try:
                return datetime.strptime(ts_str, fmt)
            except ValueError:
                continue
    except Exception:
        pass
    return None

def read_task_frontmatter(task_id):
    """Read frontmatter fields from a task markdown file."""
    patterns = [
        os.path.join(kanban_dir, "board", "*", f"{task_id}.md"),
        os.path.join(kanban_dir, "archive", "board", "*", f"{task_id}.md"),
    ]
    task_file = None
    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            task_file = matches[0]
            break
    if not task_file:
        return {}
    try:
        with open(task_file, 'r') as f:
            content = f.read()
    except Exception:
        return {}
    # Extract YAML frontmatter
    m = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not m:
        return {}
    return {"_raw_yaml": m.group(1), "_file": task_file, "_content": content}

def _infer_phase_from_path(file_path):
    """Infer phase from the board directory the task file is in."""
    if not file_path:
        return None
    parts = file_path.replace("\\", "/").split("/")
    for i, part in enumerate(parts):
        if part == "board" and i + 1 < len(parts):
            folder = parts[i + 1]
            return PHASE_ALIASES.get(folder, None)
    return None

def build_phase_timeline(task_id):
    """Build sorted list of (datetime, phase) transitions for a task."""
    transitions = []
    fm = read_task_frontmatter(task_id)
    raw_yaml = fm.get("_raw_yaml", "")

    # Source 1: acted_by from frontmatter
    acted_by_blocks = re.findall(
        r'-\s+agent:\s+\S+\s+action:\s+(\S+)\s+date:\s+"?([^"\n]+)"?',
        raw_yaml
    )
    for action, date_str in acted_by_blocks:
        dt = parse_iso_ts(date_str)
        action_lower = action.lower()
        if not dt:
            continue
        if action_lower in ("created", "create"):
            transitions.append((dt, "backlog"))
        elif action_lower in ("claimed", "claim", "started"):
            transitions.append((dt, "in_progress"))
        elif action_lower in ("completed", "complete", "done"):
            transitions.append((dt, "done"))
        elif action_lower in ("review", "review-requested", "moved-to-review"):
            transitions.append((dt, "review"))
        elif action_lower == "move":
            # Generic "move" — infer phase from current board location
            task_file = fm.get("_file", "")
            board_phase = _infer_phase_from_path(task_file)
            if board_phase and dt:
                transitions.append((dt, board_phase))

    # Source 2: activity.jsonl events
    for evt in activity_by_task.get(task_id, []):
        dt = parse_iso_ts(evt.get("timestamp"))
        if not dt:
            continue
        action = evt.get("action", "")
        details = evt.get("details", "")
        if action == "create":
            transitions.append((dt, "backlog"))
        elif action == "move":
            _, to_phase = parse_move_phase(details)
            if to_phase and to_phase != "done":
                transitions.append((dt, to_phase))
            elif to_phase == "done":
                transitions.append((dt, "done"))
        elif action == "claim":
            transitions.append((dt, "in_progress"))
        elif action == "complete":
            transitions.append((dt, "done"))

    # Source 3: created_at fallback
    created_at_m = re.search(r'created_at:\s*"?([^"\n]+)"?', raw_yaml)
    if created_at_m:
        dt = parse_iso_ts(created_at_m.group(1))
        if dt:
            transitions.append((dt, "backlog"))

    # Source 4: current board location as final known phase
    # If task is in board/review/, any session after last transition is "review"
    task_file = fm.get("_file", "")
    board_phase = _infer_phase_from_path(task_file)
    if board_phase:
        # Use the last acted_by date (or created_at) as the transition time
        last_dt = transitions[-1][0] if transitions else None
        if last_dt and (not transitions or transitions[-1][1] != board_phase):
            transitions.append((last_dt, board_phase))

    # Deduplicate and sort by timestamp
    seen = set()
    unique = []
    for t in transitions:
        key = (t[0].isoformat() if t[0] else "", t[1])
        if key not in seen:
            seen.add(key)
            unique.append(t)
    unique.sort(key=lambda x: x[0])

    # Fill implicit intermediate phases
    # Kanban flow: backlog -> todo -> in_progress -> review -> done
    PHASE_ORDER = ["backlog", "todo", "in_progress", "review", "done"]
    if len(unique) >= 2:
        filled = [unique[0]]
        for i in range(1, len(unique)):
            prev_phase = filled[-1][1]
            next_phase = unique[i][1]
            prev_idx = PHASE_ORDER.index(prev_phase) if prev_phase in PHASE_ORDER else -1
            next_idx = PHASE_ORDER.index(next_phase) if next_phase in PHASE_ORDER else -1
            # If there are skipped phases, interpolate them evenly
            if prev_idx >= 0 and next_idx > prev_idx + 1:
                gap_phases = PHASE_ORDER[prev_idx + 1 : next_idx]
                prev_dt = filled[-1][0]
                next_dt = unique[i][0]
                total_gap = (next_dt - prev_dt).total_seconds()
                step = total_gap / (len(gap_phases) + 1)
                for j, gp in enumerate(gap_phases):
                    from datetime import timedelta
                    interp_dt = prev_dt + timedelta(seconds=step * (j + 1))
                    filled.append((interp_dt, gp))
            filled.append(unique[i])
        unique = filled

    return unique

def get_phase_at_time(session_ts, phase_timeline):
    """Given a session timestamp, return which phase the task was in."""
    if not phase_timeline:
        return "backlog"
    current_phase = phase_timeline[0][1]
    for ts, phase in phase_timeline:
        if ts <= session_ts:
            current_phase = phase
        else:
            break
    return current_phase

# Cache for phase timelines
_phase_timeline_cache = {}
def get_cached_timeline(task_id):
    if task_id not in _phase_timeline_cache:
        _phase_timeline_cache[task_id] = build_phase_timeline(task_id)
    return _phase_timeline_cache[task_id]

# Per-task token accumulator: keyed by (agent, task_id)
task_tokens = defaultdict(lambda: {
    "input": 0, "output": 0, "cache_create": 0, "cache_read": 0,
    "sessions": set(), "first_seen": None, "last_seen": None,
    "by_phase": defaultdict(int),
})

agent_totals = defaultdict(lambda: {"input": 0, "output": 0, "cache_create": 0, "cache_read": 0, "sessions": 0})

def find_task_ids_in_text(text):
    """Extract TASK-NNNN patterns from text."""
    if isinstance(text, str):
        return set(task_pattern.findall(text))
    return set()

# ──────────────────────────────────────────────────────────────
# CLAUDE CODE logs
# ──────────────────────────────────────────────────────────────
def process_claude_code():
    jsonl_files = []
    if os.path.isdir(claude_projects_dir):
        for dirpath, _, filenames in os.walk(claude_projects_dir):
            for f in filenames:
                if f.endswith(".jsonl"):
                    jsonl_files.append(os.path.join(dirpath, f))

    for jsonl_file in sorted(jsonl_files):
        session_id = os.path.basename(jsonl_file).replace(".jsonl", "")
        parent_dir = os.path.basename(os.path.dirname(jsonl_file))

        if project_filter:
            if project_filter == "aquario" and "aquario" not in parent_dir:
                continue
            if project_filter == "kanbania" and "kanbania" not in parent_dir:
                continue
            if project_filter == "mdm-terraform" and "MDM" not in parent_dir:
                continue

        session_task_ids = set()
        session_in = 0
        session_out = 0
        session_cc = 0
        session_cr = 0
        session_ts = None

        try:
            with open(jsonl_file, 'r') as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    ts = entry.get("timestamp")

                    # Find task IDs in user messages
                    if entry.get("type") == "user":
                        msg = entry.get("message", {})
                        content = msg.get("content", "")
                        if isinstance(content, str):
                            session_task_ids.update(find_task_ids_in_text(content))
                        elif isinstance(content, list):
                            for block in content:
                                if isinstance(block, dict):
                                    text = block.get("text", "") or block.get("input", "")
                                    session_task_ids.update(find_task_ids_in_text(str(text)))

                    # Find task IDs in assistant messages
                    if entry.get("type") == "assistant":
                        msg = entry.get("message", {})
                        content = msg.get("content", [])
                        if isinstance(content, list):
                            for block in content:
                                if isinstance(block, dict):
                                    text = block.get("text", "") or block.get("input", "")
                                    session_task_ids.update(find_task_ids_in_text(str(text)))

                        usage = msg.get("usage", {})
                        if usage:
                            session_in += usage.get("input_tokens", 0) or 0
                            session_out += usage.get("output_tokens", 0) or 0
                            session_cc += usage.get("cache_creation_input_tokens", 0) or 0
                            session_cr += usage.get("cache_read_input_tokens", 0) or 0
                            if not session_ts and ts:
                                session_ts = ts

        except Exception:
            continue

        agent_totals["claude-code"]["input"] += session_in
        agent_totals["claude-code"]["output"] += session_out
        agent_totals["claude-code"]["cache_create"] += session_cc
        agent_totals["claude-code"]["cache_read"] += session_cr
        agent_totals["claude-code"]["sessions"] += 1

        if session_task_ids and (session_in + session_out) > 0:
            n = len(session_task_ids)
            session_total = (session_in + session_out) // n
            for tid in session_task_ids:
                key = ("claude-code", tid)
                task_tokens[key]["input"] += session_in // n
                task_tokens[key]["output"] += session_out // n
                task_tokens[key]["cache_create"] += session_cc // n
                task_tokens[key]["cache_read"] += session_cr // n
                task_tokens[key]["sessions"].add(session_id)
                if session_ts:
                    if not task_tokens[key]["first_seen"] or session_ts < task_tokens[key]["first_seen"]:
                        task_tokens[key]["first_seen"] = session_ts
                    if not task_tokens[key]["last_seen"] or session_ts > task_tokens[key]["last_seen"]:
                        task_tokens[key]["last_seen"] = session_ts
                # Phase tracking
                ts_dt = parse_iso_ts(session_ts) if session_ts else None
                if ts_dt:
                    timeline = get_cached_timeline(tid)
                    phase = get_phase_at_time(ts_dt, timeline)
                    if phase in PHASES:
                        task_tokens[key]["by_phase"][phase] += session_total

# ──────────────────────────────────────────────────────────────
# CODEX logs
# ──────────────────────────────────────────────────────────────
def process_codex():
    jsonl_files = []
    if os.path.isdir(codex_sessions_dir):
        for dirpath, _, filenames in os.walk(codex_sessions_dir):
            for f in filenames:
                if f.endswith(".jsonl"):
                    jsonl_files.append(os.path.join(dirpath, f))

    for jsonl_file in sorted(jsonl_files):
        session_id = os.path.basename(jsonl_file).replace(".jsonl", "")

        session_task_ids = set()
        session_in = 0
        session_out = 0
        session_cc = 0
        session_cr = 0
        session_ts = None
        session_cwd = ""
        last_total_usage = None

        try:
            with open(jsonl_file, 'r') as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    ts = entry.get("timestamp")
                    entry_type = entry.get("type", "")
                    payload = entry.get("payload", {})

                    # session_meta — get cwd for project filtering
                    if entry_type == "session_meta":
                        session_cwd = payload.get("cwd", "")
                        if not session_ts:
                            session_ts = payload.get("timestamp") or ts

                    # user_message event — find task IDs
                    if entry_type == "event_msg" and payload.get("type") == "user_message":
                        msg = payload.get("message", "")
                        session_task_ids.update(find_task_ids_in_text(msg))

                    # agent_message event — find task IDs
                    if entry_type == "event_msg" and payload.get("type") == "agent_message":
                        msg = payload.get("message", "")
                        session_task_ids.update(find_task_ids_in_text(msg))

                    # response_item — find task IDs in content
                    if entry_type == "response_item":
                        content = payload.get("content", [])
                        if isinstance(content, list):
                            for block in content:
                                if isinstance(block, dict):
                                    text = block.get("text", "") or block.get("input", "")
                                    session_task_ids.update(find_task_ids_in_text(str(text)))
                        # Also check function call arguments
                        if payload.get("type") == "function_call":
                            args = payload.get("arguments", "")
                            session_task_ids.update(find_task_ids_in_text(str(args)))
                        # Also check function_call_output
                        if payload.get("type") == "function_call_output":
                            output = payload.get("output", "")
                            session_task_ids.update(find_task_ids_in_text(str(output)))

                    # token_count event — cumulative, keep the last one
                    if entry_type == "event_msg" and payload.get("type") == "token_count":
                        info = payload.get("info")
                        if info and info.get("total_token_usage"):
                            last_total_usage = info["total_token_usage"]

        except Exception:
            continue

        # Project filter for Codex (based on cwd)
        if project_filter:
            if project_filter == "aquario" and "aquario" not in session_cwd:
                continue
            if project_filter == "kanbania" and "kanbania" not in session_cwd:
                continue
            if project_filter == "mdm-terraform" and ("MDM" not in session_cwd and "mdm" not in session_cwd):
                continue

        # Extract final totals from last token_count event
        if last_total_usage:
            session_in = last_total_usage.get("input_tokens", 0) or 0
            session_out = last_total_usage.get("output_tokens", 0) or 0
            session_cc = last_total_usage.get("cached_input_tokens", 0) or 0
            session_cr = 0  # Codex doesn't separate cache_read

        agent_totals["codex"]["input"] += session_in
        agent_totals["codex"]["output"] += session_out
        agent_totals["codex"]["cache_create"] += session_cc
        agent_totals["codex"]["cache_read"] += session_cr
        agent_totals["codex"]["sessions"] += 1

        if session_task_ids and (session_in + session_out) > 0:
            n = len(session_task_ids)
            session_total = (session_in + session_out) // n
            for tid in session_task_ids:
                key = ("codex", tid)
                task_tokens[key]["input"] += session_in // n
                task_tokens[key]["output"] += session_out // n
                task_tokens[key]["cache_create"] += session_cc // n
                task_tokens[key]["cache_read"] += session_cr // n
                task_tokens[key]["sessions"].add(session_id)
                if session_ts:
                    if not task_tokens[key]["first_seen"] or session_ts < task_tokens[key]["first_seen"]:
                        task_tokens[key]["first_seen"] = session_ts
                    if not task_tokens[key]["last_seen"] or session_ts > task_tokens[key]["last_seen"]:
                        task_tokens[key]["last_seen"] = session_ts
                # Phase tracking
                ts_dt = parse_iso_ts(session_ts) if session_ts else None
                if ts_dt:
                    timeline = get_cached_timeline(tid)
                    phase = get_phase_at_time(ts_dt, timeline)
                    if phase in PHASES:
                        task_tokens[key]["by_phase"][phase] += session_total

# ──────────────────────────────────────────────────────────────
# Run extraction
# ──────────────────────────────────────────────────────────────
if agent_filter in ("all", "claude-code"):
    process_claude_code()
if agent_filter in ("all", "codex"):
    process_codex()

# ──────────────────────────────────────────────────────────────
# Merge per-task totals across agents
# ──────────────────────────────────────────────────────────────
merged_tasks = defaultdict(lambda: {
    "input": 0, "output": 0, "cache_create": 0, "cache_read": 0,
    "sessions": set(), "agents": set(), "by_phase": defaultdict(int)
})
for (agent, tid), t in task_tokens.items():
    merged_tasks[tid]["input"] += t["input"]
    merged_tasks[tid]["output"] += t["output"]
    merged_tasks[tid]["cache_create"] += t["cache_create"]
    merged_tasks[tid]["cache_read"] += t["cache_read"]
    merged_tasks[tid]["sessions"].update(t["sessions"])
    merged_tasks[tid]["agents"].add(agent)
    for phase, tokens in t["by_phase"].items():
        merged_tasks[tid]["by_phase"][phase] += tokens

# Also keep per-agent view
per_agent_tasks = defaultdict(lambda: defaultdict(lambda: {"input": 0, "output": 0, "total": 0, "sessions": 0}))
for (agent, tid), t in task_tokens.items():
    total = t["input"] + t["output"]
    per_agent_tasks[agent][tid]["input"] = t["input"]
    per_agent_tasks[agent][tid]["output"] = t["output"]
    per_agent_tasks[agent][tid]["total"] = total
    per_agent_tasks[agent][tid]["sessions"] = len(t["sessions"])

# ──────────────────────────────────────────────────────────────
# Output
# ──────────────────────────────────────────────────────────────
total_input = sum(a["input"] for a in agent_totals.values())
total_output = sum(a["output"] for a in agent_totals.values())
total_sessions = sum(a["sessions"] for a in agent_totals.values())

if summary_mode:
    print(f"\n{'='*70}")
    print(f"TOKEN USAGE SUMMARY")
    if project_filter:
        print(f"Project: {project_filter}")
    if agent_filter != "all":
        print(f"Agent: {agent_filter}")
    print(f"{'='*70}")
    for agent_id in sorted(agent_totals.keys()):
        a = agent_totals[agent_id]
        agent_tasks = [tid for (ag, tid) in task_tokens if ag == agent_id]
        print(f"\n  {agent_id}:")
        print(f"    Sessions:       {a['sessions']:>10,}")
        print(f"    Tasks matched:  {len(agent_tasks):>10,}")
        print(f"    Input tokens:   {a['input']:>10,}")
        print(f"    Output tokens:  {a['output']:>10,}")
        print(f"    Total (in+out): {a['input'] + a['output']:>10,}")
    print(f"\n  COMBINED:")
    print(f"    Sessions:       {total_sessions:>10,}")
    print(f"    Tasks matched:  {len(merged_tasks):>10,}")
    print(f"    Input tokens:   {total_input:>10,}")
    print(f"    Output tokens:  {total_output:>10,}")
    print(f"    Total (in+out): {total_input + total_output:>10,}")
    print(f"{'='*70}")

elif csv_mode:
    print("task_id,agent,input_tokens,output_tokens,cache_create,cache_read,total,sessions")
    for (agent, tid) in sorted(task_tokens.keys()):
        t = task_tokens[(agent, tid)]
        total = t["input"] + t["output"]
        print(f'{tid},{agent},{t["input"]},{t["output"]},{t["cache_create"]},{t["cache_read"]},{total},{len(t["sessions"])}')

else:
    # Table format — show per-agent breakdown
    print(f"\n{'='*90}")
    print(f"TOKEN USAGE PER TASK")
    if project_filter:
        print(f"Project: {project_filter}")
    if agent_filter != "all":
        print(f"Agent: {agent_filter}")
    print(f"{'='*90}")
    print(f"{'TASK':<12} {'AGENT':<13} {'INPUT':>10} {'OUTPUT':>10} {'CACHE_CR':>10} {'CACHE_RD':>10} {'TOTAL':>10} {'SESS':>5}")
    print(f"{'-'*12} {'-'*13} {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*5}")

    for tid in sorted(merged_tasks.keys()):
        for agent_id in sorted(merged_tasks[tid]["agents"]):
            t = task_tokens[(agent_id, tid)]
            total = t["input"] + t["output"]
            print(f'{tid:<12} {agent_id:<13} {t["input"]:>10,} {t["output"]:>10,} {t["cache_create"]:>10,} {t["cache_read"]:>10,} {total:>10,} {len(t["sessions"]):>5}')

    print(f"{'-'*12} {'-'*13} {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*10} {'-'*5}")

    for agent_id in sorted(agent_totals.keys()):
        a = agent_totals[agent_id]
        task_in = sum(t["input"] for (ag, _), t in task_tokens.items() if ag == agent_id)
        task_out = sum(t["output"] for (ag, _), t in task_tokens.items() if ag == agent_id)
        print(f'{"TOTAL":<12} {agent_id:<13} {task_in:>10,} {task_out:>10,} {"":>10} {"":>10} {task_in+task_out:>10,}')

    grand_task_in = sum(t["input"] for t in merged_tasks.values())
    grand_task_out = sum(t["output"] for t in merged_tasks.values())
    print(f'{"GRAND TOTAL":<12} {"":>13} {grand_task_in:>10,} {grand_task_out:>10,} {"":>10} {"":>10} {grand_task_in+grand_task_out:>10,}')
    print(f"{'='*90}")

# ──────────────────────────────────────────────────────────────
# Update task files (additive: sums claude-code + codex tokens)
# ──────────────────────────────────────────────────────────────
if update_tasks:
    updated = 0
    for tid, t in merged_tasks.items():
        total = t["input"] + t["output"]
        if total == 0:
            continue
        patterns = [
            os.path.join(kanban_dir, "board", "*", f"{tid}.md"),
            os.path.join(kanban_dir, "archive", "board", "*", f"{tid}.md"),
        ]
        task_file = None
        for pattern in patterns:
            matches = glob.glob(pattern)
            if matches:
                task_file = matches[0]
                break
        if not task_file:
            continue

        with open(task_file, 'r') as f:
            content = f.read()

        # Update tokens_used
        if "tokens_used:" in content:
            content = re.sub(r'tokens_used: \d+', f'tokens_used: {total}', content)
        else:
            content = content.replace('\n---\n', f'\ntokens_used: {total}\n---\n', 1)

        # Build tokens_by_phase YAML block
        by_phase = t["by_phase"]
        phase_lines = []
        for phase in PHASES:
            if by_phase.get(phase, 0) > 0:
                phase_lines.append(f"  {phase}: {by_phase[phase]}")

        if phase_lines:
            phase_block = "tokens_by_phase:\n" + "\n".join(phase_lines)
            # Remove existing tokens_by_phase block (multiline)
            content = re.sub(
                r'tokens_by_phase:\n(?:  \w+: \d+\n?)*',
                '',
                content
            )
            # Insert after tokens_used line
            content = re.sub(
                r'(tokens_used: \d+)\n',
                r'\1\n' + phase_block + '\n',
                content,
                count=1
            )

        with open(task_file, 'w') as f:
            f.write(content)
        updated += 1

    agents_str = ", ".join(sorted(agent_totals.keys()))
    print(f"\nUpdated {updated} task files with token usage from: {agents_str}")

PYEOF
