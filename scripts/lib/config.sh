#!/usr/bin/env bash
# =============================================================================
# scripts/lib/config.sh — Central configuration library
# =============================================================================
#
# Usage: source "$(dirname "${BASH_SOURCE[0]}")/lib/config.sh"
#
# Public functions:
#   cfg <yq-path> [default]             Read value from config.yaml (merged with local)
#   get_columns                          List column IDs in order (one per line)
#   get_agent_role [agent-id]            Return role of agent (implementer/reviewer/both/pm)
#   get_reviewers                        List agent IDs with role reviewer or both
#   can_transition <from-col> <to-col>   Exit 0 if transition is allowed, 1 otherwise
#   get_project_path <slug>              Return local path of project (config.local.yaml)
#   get_project_worktree <slug> [agent]  Return worktree path for agent in project
#   resolve_board <task-file>            Return board/ dir for task (proj/sub-aware)
#   resolve_sprint <task-file>           Return sprints/ dir for task (proj/sub-aware)
#   resolve_okrs <task-file>             Return okrs/ dir for task (proj/sub-aware)
#   get_board_dirs                       List all board dirs (global + projects + subprojects)
#   notify <urgency> <title> <body>      Send notification via configured provider
#
# Auto-detected:
#   KANBAN_ROOT   via git rev-parse --show-toplevel (or $KANBAN_ROOT env var)
#   KB_AGENT      via $KB_AGENT env var or first implementer in config.yaml
#
# Dependencies:
#   yq >= 4.x   https://github.com/mikefarah/yq
#   Install:    wget -qO ~/.local/bin/yq \
#               https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 \
#               && chmod +x ~/.local/bin/yq
#
# =============================================================================

# Guard against double-sourcing
[[ -n "${_KANBANIA_CONFIG_LOADED:-}" ]] && return 0
readonly _KANBANIA_CONFIG_LOADED=1

# Require bash 4+
if [[ "${BASH_VERSINFO[0]}" -lt 4 ]]; then
  echo "ERROR: config.sh requires bash 4+. Current: $BASH_VERSION" >&2
  return 1
fi

# -----------------------------------------------------------------------------
# Dependency check
# -----------------------------------------------------------------------------
if ! command -v yq &>/dev/null; then
  echo "ERROR: yq not found. Install: https://github.com/mikefarah/yq" >&2
  echo "       wget -qO ~/.local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64" >&2
  return 1
fi

# -----------------------------------------------------------------------------
# KANBAN_ROOT auto-detection
# -----------------------------------------------------------------------------
if [[ -z "${KANBAN_ROOT:-}" ]]; then
  # Try to detect from the script's own location (scripts/lib/ → root)
  _script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  _detected="$(git -C "$_script_dir" rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "$_detected" ]]; then
    KANBAN_ROOT="$_detected"
  else
    echo "ERROR: KANBAN_ROOT not set and could not be detected via git." >&2
    echo "       Set KANBAN_ROOT=/path/to/your/kanbania before sourcing config.sh" >&2
    return 1
  fi
fi
export KANBAN_ROOT

# -----------------------------------------------------------------------------
# Config file paths
# -----------------------------------------------------------------------------
_CFG_YAML="${KANBAN_ROOT}/config.yaml"
_CFG_LOCAL="${KANBAN_ROOT}/config.local.yaml"

if [[ ! -f "$_CFG_YAML" ]]; then
  echo "ERROR: config.yaml not found at ${_CFG_YAML}" >&2
  return 1
fi

# -----------------------------------------------------------------------------
# KB_AGENT auto-detection
# -----------------------------------------------------------------------------
if [[ -z "${KB_AGENT:-}" ]]; then
  KB_AGENT="$(yq '.agents[] | select(.role == "implementer") | .id' "$_CFG_YAML" 2>/dev/null | head -1 || true)"
  if [[ -z "$KB_AGENT" || "$KB_AGENT" == "null" ]]; then
    KB_AGENT="$(yq '.agents[0].id' "$_CFG_YAML" 2>/dev/null || true)"
  fi
  if [[ -z "$KB_AGENT" || "$KB_AGENT" == "null" ]]; then
    KB_AGENT="human"
  fi
fi
export KB_AGENT

# =============================================================================
# cfg <yq-path> [default]
#
# Read a value from config.yaml, with override from config.local.yaml.
# config.local.yaml takes precedence field by field (deep merge semantics).
#
# Examples:
#   cfg '.owner.name'                    → "kadufarah"
#   cfg '.sprint.duration_days' '14'     → "14"
#   cfg '.notifications.provider' 'none' → "none"
# =============================================================================
cfg() {
  local path="$1"
  local default="${2:-}"
  local value=""

  # config.local.yaml has priority
  if [[ -f "$_CFG_LOCAL" ]]; then
    value="$(yq "$path" "$_CFG_LOCAL" 2>/dev/null || true)"
    if [[ -n "$value" && "$value" != "null" ]]; then
      printf '%s' "$value"
      return 0
    fi
  fi

  # Fallback to config.yaml
  value="$(yq "$path" "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -n "$value" && "$value" != "null" ]]; then
    printf '%s' "$value"
    return 0
  fi

  # Fallback to default
  printf '%s' "$default"
}

# =============================================================================
# get_columns
#
# Print column IDs one per line, in the order defined in config.yaml.
#
# Example:
#   mapfile -t COLS < <(get_columns)
#   echo "${COLS[*]}"   → backlog todo in-progress review done
# =============================================================================
get_columns() {
  local cols
  cols="$(yq '.board.columns[].id' "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -z "$cols" || "$cols" == "null" ]]; then
    printf 'backlog\ntodo\nin-progress\nreview\ndone\n'
  else
    printf '%s\n' "$cols"
  fi
}

# =============================================================================
# get_agent_role [agent-id]
#
# Return the role of an agent as defined in config.yaml > agents[].role.
# If agent-id is omitted, uses $KB_AGENT.
# Returns: implementer | reviewer | both | pm  (default: implementer)
#
# Example:
#   get_agent_role "codex"   → "reviewer"
# =============================================================================
get_agent_role() {
  local agent_id="${1:-$KB_AGENT}"
  local role
  role="$(yq ".agents[] | select(.id == \"${agent_id}\") | .role" "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -z "$role" || "$role" == "null" ]]; then
    printf 'implementer'
  else
    printf '%s' "$role"
  fi
}

# =============================================================================
# get_reviewers
#
# Print agent IDs with role "reviewer" or "both", one per line.
#
# Example:
#   mapfile -t REVIEWERS < <(get_reviewers)
# =============================================================================
get_reviewers() {
  local result
  result="$(yq '.agents[] | select(.role == "reviewer" or .role == "both") | .id' "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -n "$result" && "$result" != "null" ]]; then
    printf '%s\n' "$result"
  fi
}

# =============================================================================
# get_all_agent_ids
#
# Print all agent IDs, one per line.
# =============================================================================
get_all_agent_ids() {
  local result
  result="$(yq '.agents[].id' "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -n "$result" && "$result" != "null" ]]; then
    printf '%s\n' "$result"
  fi
}

# =============================================================================
# can_transition <from-column> <to-column>
#
# Exit 0 if the transition is defined in config.yaml > workflow.transitions.
# Exit 1 if not defined (no workflow section = allow all transitions).
#
# Example:
#   can_transition "todo" "in-progress" && echo "allowed"
# =============================================================================
can_transition() {
  local from="$1"
  local to="$2"

  # If no workflow.transitions defined, allow all
  local has_transitions
  has_transitions="$(yq '.workflow.transitions | length' "$_CFG_YAML" 2>/dev/null || true)"
  if [[ -z "$has_transitions" || "$has_transitions" == "0" || "$has_transitions" == "null" ]]; then
    return 0
  fi

  local match
  match="$(yq ".workflow.transitions[] | select(.from == \"${from}\" and .to == \"${to}\") | .from" "$_CFG_YAML" 2>/dev/null || true)"
  [[ -n "$match" && "$match" != "null" ]]
}

# =============================================================================
# get_project_path <slug>
#
# Return the local filesystem path of a project.
# Reads from config.local.yaml first, then config.yaml.
#
# Example:
#   get_project_path "my-project"   → "/home/user/Projects/my-project"
# =============================================================================
get_project_path() {
  local slug="$1"
  local path=""

  if [[ -f "$_CFG_LOCAL" ]]; then
    path="$(yq ".projects.${slug}.path" "$_CFG_LOCAL" 2>/dev/null || true)"
  fi
  if [[ -z "$path" || "$path" == "null" ]]; then
    path="$(yq ".projects.${slug}.path" "$_CFG_YAML" 2>/dev/null || true)"
  fi

  if [[ -n "$path" && "$path" != "null" ]]; then
    printf '%s' "$path"
  fi
}

# =============================================================================
# get_project_worktree <slug> [agent-id]
#
# Return the worktree path for an agent in a project.
# Reads from config.local.yaml (worktrees are always local).
# If agent-id omitted, uses $KB_AGENT.
#
# Example:
#   get_project_worktree "my-project" "codex"  → "/home/user/Projects/my-project-codex"
# =============================================================================
get_project_worktree() {
  local slug="$1"
  local agent="${2:-$KB_AGENT}"
  local path=""

  if [[ -f "$_CFG_LOCAL" ]]; then
    path="$(yq ".projects.${slug}.worktrees.${agent}" "$_CFG_LOCAL" 2>/dev/null || true)"
  fi

  if [[ -n "$path" && "$path" != "null" ]]; then
    printf '%s' "$path"
  fi
}

# =============================================================================
# resolve_board <task-file>
#
# Return the board/ directory that owns the given task file.
# Resolution order:
#   1. projects/<proj>/subprojects/<sub>/board/  — if subproject field is set and dir exists
#   2. projects/<proj>/board/                    — if dir exists
#   3. ${KANBAN_ROOT}/board                      — global fallback (backward compat)
#
# Example:
#   resolve_board "projects/my-app/subprojects/backend/board/todo/TASK-0001.md"
#   → /path/to/kanbania/projects/my-app/subprojects/backend/board
# =============================================================================
resolve_board() {
  local task_file="$1"
  local proj sub
  proj=$(grep '^project:' "$task_file" 2>/dev/null | sed 's/^project: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)
  sub=$(grep '^subproject:' "$task_file" 2>/dev/null | sed 's/^subproject: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)

  if [[ -n "$sub" && "$sub" != "null" && -n "$proj" && "$proj" != "null" ]]; then
    local sub_board="${KANBAN_ROOT}/projects/${proj}/subprojects/${sub}/board"
    if [[ -d "$sub_board" ]]; then
      printf '%s' "$sub_board"
      return 0
    fi
  fi

  if [[ -n "$proj" && "$proj" != "null" ]]; then
    local proj_board="${KANBAN_ROOT}/projects/${proj}/board"
    if [[ -d "$proj_board" ]]; then
      printf '%s' "$proj_board"
      return 0
    fi
  fi

  printf '%s' "${KANBAN_ROOT}/board"
}

# =============================================================================
# resolve_sprint <task-file>
#
# Return the sprints/ directory for the given task file.
# Same resolution order as resolve_board but for sprints/.
# =============================================================================
resolve_sprint() {
  local task_file="$1"
  local proj sub
  proj=$(grep '^project:' "$task_file" 2>/dev/null | sed 's/^project: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)
  sub=$(grep '^subproject:' "$task_file" 2>/dev/null | sed 's/^subproject: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)

  if [[ -n "$sub" && "$sub" != "null" && -n "$proj" && "$proj" != "null" ]]; then
    local sub_sprints="${KANBAN_ROOT}/projects/${proj}/subprojects/${sub}/sprints"
    if [[ -d "$sub_sprints" ]]; then
      printf '%s' "$sub_sprints"
      return 0
    fi
  fi

  if [[ -n "$proj" && "$proj" != "null" ]]; then
    local proj_sprints="${KANBAN_ROOT}/projects/${proj}/sprints"
    if [[ -d "$proj_sprints" ]]; then
      printf '%s' "$proj_sprints"
      return 0
    fi
  fi

  printf '%s' "${KANBAN_ROOT}/sprints"
}

# =============================================================================
# resolve_okrs <task-file>
#
# Return the okrs/ directory for the given task file.
# Same resolution order as resolve_board but for okrs/.
# =============================================================================
resolve_okrs() {
  local task_file="$1"
  local proj sub
  proj=$(grep '^project:' "$task_file" 2>/dev/null | sed 's/^project: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)
  sub=$(grep '^subproject:' "$task_file" 2>/dev/null | sed 's/^subproject: *//' | tr -d '"' | tr -d "'" | tr -d ' ' | head -1 || true)

  if [[ -n "$sub" && "$sub" != "null" && -n "$proj" && "$proj" != "null" ]]; then
    local sub_okrs="${KANBAN_ROOT}/projects/${proj}/subprojects/${sub}/okrs"
    if [[ -d "$sub_okrs" ]]; then
      printf '%s' "$sub_okrs"
      return 0
    fi
  fi

  if [[ -n "$proj" && "$proj" != "null" ]]; then
    local proj_okrs="${KANBAN_ROOT}/projects/${proj}/okrs"
    if [[ -d "$proj_okrs" ]]; then
      printf '%s' "$proj_okrs"
      return 0
    fi
  fi

  printf '%s' "${KANBAN_ROOT}/okrs"
}

# =============================================================================
# get_board_dirs
#
# Print ALL board directories, one per line:
#   1. Global ${KANBAN_ROOT}/board
#   2. projects/*/board
#   3. projects/*/subprojects/*/board
# Only prints directories that actually exist.
#
# Example:
#   while IFS= read -r board_dir; do
#     echo "Board: $board_dir"
#   done < <(get_board_dirs)
# =============================================================================
get_board_dirs() {
  # Global board (always first)
  echo "${KANBAN_ROOT}/board"

  # Project-level boards
  local proj_board
  for proj_board in "${KANBAN_ROOT}"/projects/*/board; do
    [[ -d "$proj_board" ]] && echo "$proj_board"
  done

  # Subproject-level boards
  local sub_board
  for sub_board in "${KANBAN_ROOT}"/projects/*/subprojects/*/board; do
    [[ -d "$sub_board" ]] && echo "$sub_board"
  done
}

# =============================================================================
# notify <urgency> <title> <body>
#
# Send a notification via the provider configured in config.yaml.
# Providers: none (default), notify-send, slack, webhook
# Credentials for slack/webhook go in config.local.yaml > notifications.settings
#
# urgency values: low | normal | critical
#
# Examples:
#   notify normal  "Task claimed"  "TASK-0001 is now in-progress"
#   notify critical "Build failed" "Sprint 42 gate failed"
# =============================================================================
notify() {
  local urgency="${1:-normal}"
  local title="${2:-Kanbania}"
  local body="${3:-}"
  local provider
  provider="$(cfg '.notifications.provider' 'none')"

  case "$provider" in
    notify-send)
      if command -v notify-send &>/dev/null; then
        notify-send -u "$urgency" "$title" "$body" 2>/dev/null || true
      fi
      ;;
    slack)
      local webhook
      webhook="$(cfg '.notifications.settings.slack_webhook' '')"
      if [[ -n "$webhook" ]]; then
        local payload
        payload="{\"text\":\"*${title}*: ${body}\"}"
        curl -sf -X POST "$webhook" -H 'Content-type: application/json' -d "$payload" &>/dev/null || true
      fi
      ;;
    webhook)
      local url
      url="$(cfg '.notifications.settings.webhook_url' '')"
      if [[ -n "$url" ]]; then
        local payload
        payload="{\"urgency\":\"${urgency}\",\"title\":\"${title}\",\"body\":\"${body}\"}"
        curl -sf -X POST "$url" -H 'Content-type: application/json' -d "$payload" &>/dev/null || true
      fi
      ;;
    telegram)
      local token chat_id
      token="$(cfg '.notifications.settings.telegram_bot_token' '')"
      chat_id="$(cfg '.notifications.settings.telegram_chat_id' '')"
      if [[ -n "$token" && -n "$chat_id" ]]; then
        local msg="${title}: ${body}"
        curl -sf "https://api.telegram.org/bot${token}/sendMessage" \
          -d "chat_id=${chat_id}" \
          -d "text=${msg}" &>/dev/null || true
      fi
      ;;
    none|*)
      # No-op: headless server or notifications disabled
      ;;
  esac
}
