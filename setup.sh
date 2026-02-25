#!/usr/bin/env bash
# =============================================================================
# setup.sh — Kanbania Setup Wizard
# =============================================================================
# Usage:
#   ./setup.sh              Interactive setup (asks quick vs detailed)
#   ./setup.sh --quick      Non-interactive quick setup with defaults
#   ./setup.sh --detailed   Full interactive configuration
#   ./setup.sh --from-config Re-read existing config.yaml and regenerate
#   ./setup.sh --upgrade    Merge new schema keys into existing config
#   ./setup.sh --help       Show this help
# =============================================================================

set -euo pipefail

# ─── Constants ────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KANBAN_ROOT="${SCRIPT_DIR}"
CONFIG_FILE="${KANBAN_ROOT}/config.yaml"
LOCAL_CONFIG_FILE="${KANBAN_ROOT}/config.local.yaml"
GITIGNORE_FILE="${KANBAN_ROOT}/.gitignore"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ─── UI Helpers ───────────────────────────────────────────────────────────────

print_header() {
    echo
    echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║              Kanbania Setup Wizard                   ║${NC}"
    echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
    echo
}

print_section() {
    echo
    echo -e "${BOLD}${CYAN}── $1 ──────────────────────────────────────────${NC}"
    echo
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error()   { echo -e "${RED}✗${NC} $1" >&2; }
print_info()    { echo -e "${DIM}  $1${NC}"; }
print_step()    { echo -e "  ${BOLD}→${NC} $1"; }

# ask VAR_NAME "Question" "default"
ask() {
    local var_name="$1"
    local question="$2"
    local default="${3:-}"
    local prompt

    if [[ -n "$default" ]]; then
        prompt="${question} ${DIM}[${default}]${NC}: "
    else
        prompt="${question}: "
    fi

    echo -en "$prompt"
    local answer
    read -r answer
    if [[ -z "$answer" && -n "$default" ]]; then
        answer="$default"
    fi
    printf -v "$var_name" '%s' "$answer"
}

# ask_yn VAR_NAME "Question" "y|n"
ask_yn() {
    local var_name="$1"
    local question="$2"
    local default="${3:-y}"
    local prompt

    if [[ "$default" == "y" ]]; then
        prompt="${question} ${DIM}[Y/n]${NC}: "
    else
        prompt="${question} ${DIM}[y/N]${NC}: "
    fi

    echo -en "$prompt"
    local answer
    read -r answer
    answer="${answer:-$default}"
    answer="${answer,,}"  # lowercase

    if [[ "$answer" == "y" || "$answer" == "yes" ]]; then
        printf -v "$var_name" 'true'
    else
        printf -v "$var_name" 'false'
    fi
}

# ask_choice VAR_NAME "Question" option1 option2 ...
ask_choice() {
    local var_name="$1"
    local question="$2"
    shift 2
    local options=("$@")
    local i=1

    echo -e "$question"
    for opt in "${options[@]}"; do
        echo -e "  ${DIM}${i})${NC} $opt"
        ((i++))
    done
    echo -en "Choice ${DIM}[1]${NC}: "
    local choice
    read -r choice
    choice="${choice:-1}"

    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#options[@]} )); then
        printf -v "$var_name" '%s' "${options[$((choice-1))]}"
    else
        printf -v "$var_name" '%s' "${options[0]}"
    fi
}

# ─── Board Structure ──────────────────────────────────────────────────────────

create_board_structure() {
    local columns=("$@")
    local created=0

    for col in "${columns[@]}"; do
        local dir="${KANBAN_ROOT}/board/${col}"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            touch "${dir}/.gitkeep"
            created=$(( created + 1 ))
        fi
    done

    # Always create logs and archive
    mkdir -p "${KANBAN_ROOT}/logs"
    mkdir -p "${KANBAN_ROOT}/archive/board"
    mkdir -p "${KANBAN_ROOT}/sprints"
    mkdir -p "${KANBAN_ROOT}/okrs"
    mkdir -p "${KANBAN_ROOT}/templates"

    if (( created > 0 )); then
        print_success "Created ${created} board column director$([ $created -eq 1 ] && echo 'y' || echo 'ies')"
    fi
}

# ─── Gitignore ────────────────────────────────────────────────────────────────

update_gitignore() {
    local entries=(
        "config.local.yaml"
        ".env"
        "*.local"
        "logs/activity.jsonl"
        "logs/rework-pending.jsonl"
        "dashboard/.next/"
        "dashboard/node_modules/"
    )

    local to_add=()
    for entry in "${entries[@]}"; do
        if ! grep -qxF "$entry" "$GITIGNORE_FILE" 2>/dev/null; then
            to_add+=("$entry")
        fi
    done

    if (( ${#to_add[@]} > 0 )); then
        printf '\n# Kanbania — auto-added by setup.sh\n' >> "$GITIGNORE_FILE"
        for entry in "${to_add[@]}"; do
            echo "$entry" >> "$GITIGNORE_FILE"
        done
        print_success "Updated .gitignore"
    fi
}

# ─── Config Generators ────────────────────────────────────────────────────────

# write_config_yaml: writes config.yaml from collected variables
write_config_yaml() {
    local system_name="$1"
    local system_lang="$2"
    local owner_name="$3"
    local owner_tz="$4"
    # agents_yaml: pre-formatted YAML block for agents section (passed via file or heredoc)
    local agents_yaml="$5"
    # columns_yaml: pre-formatted YAML block for board.columns
    local columns_yaml="$6"
    # notifications_provider
    local notif_provider="${7:-none}"

    cat > "$CONFIG_FILE" <<YAML
# =============================================================================
# config.yaml — Global Kanban System Configuration
# =============================================================================
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Edit this file to change system-wide settings.
# Machine-specific paths and secrets go in config.local.yaml (gitignored).
# =============================================================================

system:
  name: "${system_name}"
  language: "${system_lang}"

owner:
  name: "${owner_name}"
  timezone: "${owner_tz}"

agents:
${agents_yaml}
workflow:
  transitions:
    - from: "backlog"
      to: "todo"
      allowed_roles: ["implementer", "pm", "both"]
      action: "prioritize"

    - from: "todo"
      to: "in-progress"
      allowed_roles: ["implementer", "both"]
      action: "claim"

    - from: "in-progress"
      to: "review"
      allowed_roles: ["implementer", "both"]
      action: "submit_review"
      assign_to_role: "reviewer"

    - from: "review"
      to: "done"
      allowed_roles: ["reviewer", "both"]
      action: "approve"

    - from: "review"
      to: "in-progress"
      allowed_roles: ["reviewer", "both"]
      action: "reject"
      assign_to_role: "implementer"

  triggers:
    - on: "transition"
      to: "review"
      action: "exec_agent"
      target_role: "reviewer"
      prompt_template: "review"

    - on: "transition"
      from: "review"
      to: "in-progress"
      action: "exec_agent"
      target_role: "implementer"
      prompt_template: "fix"

board:
  columns:
${columns_yaml}

projects: {}

git:
  commit_prefix: "[KANBAN]"
  auto_push: true

notifications:
  provider: "${notif_provider}"
  settings: {}

sprint:
  duration_days: 14
  default_capacity: 21
  naming_pattern: "sprint-NNN"

priorities:
  - id: "critical"
    name: "Critical"
    order: 1
  - id: "high"
    name: "High"
    order: 2
  - id: "medium"
    name: "Medium"
    order: 3
  - id: "low"
    name: "Low"
    order: 4

story_points:
  allowed: [1, 2, 3, 5, 8, 13]
  max_single_task: 3
  epic_threshold: 5
  max_files_per_task: 5

labels:
  - bug
  - feature
  - refactor
  - docs
  - infra
  - security
  - performance
  - ux
  - research
  - ai-integration
  - testing
  - devops

okr:
  max_objectives_per_quarter: 5
  kr_per_objective:
    min: 2
    max: 5

paths:
  board: "board"
  okrs: "okrs"
  sprints: "sprints"
  projects: "projects"
  templates: "templates"
  logs: "logs"

subprojects:
  enabled: true
  projects_with_subprojects: []
YAML
}

write_local_config() {
    local kanban_root="$1"

    cat > "$LOCAL_CONFIG_FILE" <<YAML
# =============================================================================
# config.local.yaml — Machine-specific overrides
# =============================================================================
# This file is gitignored. Do NOT commit it.
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

paths:
  kanban_root: "${kanban_root}"

# Add project paths here:
# projects:
#   my-project:
#     path: "/absolute/path/to/project"
#     worktree: "/absolute/path/to/worktrees"

# Add notification credentials here:
# notifications:
#   settings:
#     webhook_url: "https://hooks.slack.com/services/..."
YAML
}

# ─── Default YAML blocks ──────────────────────────────────────────────────────

default_agents_yaml() {
    local owner_name="$1"
    local owner_slug
    owner_slug="$(echo "$owner_name" | tr '[:upper:] ' '[:lower:]-' | tr -dc '[:alnum:]-')"

    cat <<YAML
  - id: "${owner_slug}"
    name: "${owner_name}"
    provider: "human"
    role: "both"
    color: "#f59e0b"
    exec_command: null
    wip_limit: 5
YAML
}

default_columns_yaml() {
    cat <<YAML
    - id: "backlog"
      name: "Backlog"
      description: "Identified tasks, awaiting prioritization"
    - id: "todo"
      name: "To Do"
      description: "Prioritized for the current sprint"
    - id: "in-progress"
      name: "In Progress"
      description: "Being worked on"
    - id: "review"
      name: "Review"
      description: "Awaiting QA"
    - id: "done"
      name: "Done"
      description: "Completed and approved"
YAML
}

default_column_ids() {
    echo "backlog todo in-progress review done"
}

# ─── Quick Mode ───────────────────────────────────────────────────────────────

quick_mode() {
    print_section "Quick Setup"
    echo -e "  This will configure Kanbania with sensible defaults."
    echo -e "  Press ${BOLD}Enter${NC} to accept defaults, or type to override."
    echo

    ask SYSTEM_NAME "System name" "My Kanban"
    ask OWNER_NAME  "Your name"   "me"

    local columns_yaml agents_yaml
    agents_yaml="$(default_agents_yaml "$OWNER_NAME")"
    columns_yaml="$(default_columns_yaml)"

    # Resolve absolute kanban root
    local kanban_root
    kanban_root="$(cd "$KANBAN_ROOT" && pwd)"

    write_config_yaml "$SYSTEM_NAME" "en" "$OWNER_NAME" "UTC" "$agents_yaml" "$columns_yaml" "none"
    write_local_config "$kanban_root"
    create_board_structure backlog todo "in-progress" review done
    update_gitignore

    print_success "config.yaml written"
    print_success "config.local.yaml written"
    print_next_steps
}

# ─── Detailed Mode ────────────────────────────────────────────────────────────

detailed_mode() {
    # Phase 1: System
    print_section "1/5  System Identity"
    ask SYSTEM_NAME "System name" "My Kanban"
    ask_choice SYSTEM_LANG "Language for agent templates:" "en" "pt-BR" "es"
    ask OWNER_NAME "Your name" "me"
    ask OWNER_TZ   "Timezone (IANA)" "UTC"

    # Phase 2: Agents
    print_section "2/5  Agents"
    echo -e "  Define the agents (humans or AI) who work on this board."
    echo

    local agents_yaml=""
    local agent_ids=()
    local add_agent="true"
    local agent_count=0

    while [[ "$add_agent" == "true" ]]; do
        agent_count=$(( agent_count + 1 ))
        echo -e "  ${BOLD}Agent ${agent_count}${NC}"
        local a_id a_name a_provider a_role a_color a_exec a_wip
        a_id="" a_name="" a_provider="" a_role="" a_color="" a_exec="" a_wip=""

        ask a_id       "  ID (slug)"    "agent-${agent_count}"
        ask a_name     "  Display name" "$a_id"
        ask_choice a_provider "  Provider:" "human" "anthropic" "openai" "google"
        ask_choice a_role "  Role:" "both" "implementer" "reviewer" "pm"

        # Color palette
        declare -A COLOR_NAMES=(
            ["#a855f7"]="purple"
            ["#22c55e"]="green"
            ["#f59e0b"]="amber"
            ["#3b82f6"]="blue"
            ["#ef4444"]="red"
            ["#6b7280"]="gray"
        )
        echo -e "  Color:"
        local i=1
        local color_opts=("#a855f7 (purple)" "#22c55e (green)" "#f59e0b (amber)" "#3b82f6 (blue)" "#ef4444 (red)" "#6b7280 (gray)" "custom")
        for opt in "${color_opts[@]}"; do
            echo -e "    ${DIM}${i})${NC} ${opt}"
            ((i++))
        done
        echo -en "  Choice ${DIM}[1]${NC}: "
        read -r color_choice
        color_choice="${color_choice:-1}"
        local color_values=("#a855f7" "#22c55e" "#f59e0b" "#3b82f6" "#ef4444" "#6b7280")
        if [[ "$color_choice" == "7" ]]; then
            ask a_color "  Custom hex color" "#a855f7"
        elif [[ "$color_choice" =~ ^[1-6]$ ]]; then
            a_color="${color_values[$((color_choice-1))]}"
        else
            a_color="#a855f7"
        fi

        if [[ "$a_provider" != "human" ]]; then
            echo -en "  exec_command (leave empty for manual trigger): "
            read -r a_exec
            a_exec="${a_exec:-null}"
            if [[ "$a_exec" == "null" || -z "$a_exec" ]]; then
                a_exec="null"
            else
                a_exec="\"${a_exec}\""
            fi
        else
            a_exec="null"
        fi

        ask a_wip "  WIP limit" "3"

        agents_yaml+="  - id: \"${a_id}\"
    name: \"${a_name}\"
    provider: \"${a_provider}\"
    role: \"${a_role}\"
    color: \"${a_color}\"
    exec_command: ${a_exec}
    wip_limit: ${a_wip}
"
        agent_ids+=("$a_id")

        echo
        ask_yn add_agent "Add another agent?" "n"
    done

    # Phase 3: Columns
    print_section "3/5  Board Columns"
    local use_default_cols
    ask_yn use_default_cols "Use default columns (backlog, todo, in-progress, review, done)?" "y"

    local columns_yaml=""
    local column_ids=()

    if [[ "$use_default_cols" == "true" ]]; then
        columns_yaml="$(default_columns_yaml)"
        read -ra column_ids <<< "$(default_column_ids)"
    else
        echo -e "  Enter column IDs one per line. Press Enter with empty input to finish."
        echo -e "  ${DIM}Tip: use lowercase slugs like 'backlog', 'in-progress', 'done'${NC}"
        echo

        local add_col="true"
        while [[ "$add_col" == "true" ]]; do
            local c_id c_name c_desc
            ask c_id   "  Column ID (slug)" ""
            [[ -z "$c_id" ]] && break

            ask c_name "  Display name" "$(echo "$c_id" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')"
            ask c_desc "  Description" ""

            columns_yaml+="    - id: \"${c_id}\"
      name: \"${c_name}\"
      description: \"${c_desc}\"
"
            column_ids+=("$c_id")

            ask_yn add_col "Add another column?" "y"
        done

        if (( ${#column_ids[@]} == 0 )); then
            print_warning "No columns entered — using defaults."
            columns_yaml="$(default_columns_yaml)"
            read -ra column_ids <<< "$(default_column_ids)"
        fi
    fi

    # Phase 4: Notifications
    print_section "4/5  Notifications"
    ask_choice NOTIF_PROVIDER "Notification provider:" "none" "notify-send" "slack" "webhook" "telegram"
    local notif_note=""
    if [[ "$NOTIF_PROVIDER" != "none" && "$NOTIF_PROVIDER" != "notify-send" ]]; then
        print_info "Add credentials to config.local.yaml under notifications.settings"
    fi

    # Phase 5: Summary & Confirm
    print_section "5/5  Summary"
    echo -e "  ${BOLD}System:${NC}     ${SYSTEM_NAME} (${SYSTEM_LANG})"
    echo -e "  ${BOLD}Owner:${NC}      ${OWNER_NAME} (${OWNER_TZ})"
    echo -e "  ${BOLD}Agents:${NC}     ${agent_ids[*]}"
    echo -e "  ${BOLD}Columns:${NC}    ${column_ids[*]}"
    echo -e "  ${BOLD}Notifications:${NC} ${NOTIF_PROVIDER}"
    echo

    local confirmed
    ask_yn confirmed "Write configuration files?" "y"
    if [[ "$confirmed" != "true" ]]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 0
    fi

    local kanban_root
    kanban_root="$(cd "$KANBAN_ROOT" && pwd)"

    write_config_yaml "$SYSTEM_NAME" "$SYSTEM_LANG" "$OWNER_NAME" "$OWNER_TZ" "$agents_yaml" "$columns_yaml" "$NOTIF_PROVIDER"
    write_local_config "$kanban_root"
    create_board_structure "${column_ids[@]}"
    update_gitignore

    print_success "config.yaml written"
    print_success "config.local.yaml written"
    print_next_steps
}

# ─── --from-config Mode ───────────────────────────────────────────────────────

from_config_mode() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_error "config.yaml not found at ${CONFIG_FILE}"
        echo -e "  Run ${BOLD}./setup.sh${NC} first."
        exit 1
    fi

    echo -e "  Reading existing ${BOLD}config.yaml${NC} and recreating board structure..."
    echo

    # Extract column ids using simple grep/sed (no yq dependency required)
    # Reads the block between "board:" and the next top-level key (line starting with a letter)
    local col_ids
    mapfile -t col_ids < <(
        awk '/^board:/{found=1; next} found && /^[a-zA-Z]/{exit} found{print}' "$CONFIG_FILE" \
        | grep -E '^\s*- id:|^\s+id:' \
        | sed "s/.*id:[[:space:]]*['\"]//;s/['\"].*//"
    )

    if (( ${#col_ids[@]} == 0 )); then
        print_warning "Could not parse board.columns from config.yaml — using defaults."
        read -ra col_ids <<< "$(default_column_ids)"
    fi

    create_board_structure "${col_ids[@]}"
    update_gitignore

    local kanban_root
    kanban_root="$(cd "$KANBAN_ROOT" && pwd)"

    # Update kanban_root in local config if it exists
    if [[ -f "$LOCAL_CONFIG_FILE" ]]; then
        if grep -q "kanban_root:" "$LOCAL_CONFIG_FILE"; then
            sed -i "s|kanban_root:.*|kanban_root: \"${kanban_root}\"|" "$LOCAL_CONFIG_FILE"
            print_success "Updated kanban_root in config.local.yaml"
        fi
    else
        write_local_config "$kanban_root"
        print_success "config.local.yaml created"
    fi

    print_success "Board structure recreated from config.yaml"
    print_next_steps
}

# ─── --upgrade Mode ───────────────────────────────────────────────────────────

upgrade_mode() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_error "config.yaml not found. Run ./setup.sh first."
        exit 1
    fi

    echo -e "  Checking for new schema keys in ${BOLD}config.yaml${NC}..."
    echo

    local updated=0

    # Keys to ensure exist (key: default_value)
    declare -A REQUIRED_KEYS=(
        ["sprint.duration_days"]="14"
        ["sprint.default_capacity"]="21"
        ["sprint.naming_pattern"]="sprint-NNN"
        ["git.commit_prefix"]="[KANBAN]"
        ["git.auto_push"]="true"
        ["subprojects.enabled"]="true"
    )

    # Simple check: grep for key presence and append missing top-level sections
    local missing_sections=()

    grep -q "^sprint:" "$CONFIG_FILE" || missing_sections+=("sprint")
    grep -q "^git:" "$CONFIG_FILE" || missing_sections+=("git")
    grep -q "^subprojects:" "$CONFIG_FILE" || missing_sections+=("subprojects")
    grep -q "^priorities:" "$CONFIG_FILE" || missing_sections+=("priorities")
    grep -q "^story_points:" "$CONFIG_FILE" || missing_sections+=("story_points")
    grep -q "^paths:" "$CONFIG_FILE" || missing_sections+=("paths")

    if (( ${#missing_sections[@]} > 0 )); then
        echo -e "  Adding missing sections: ${missing_sections[*]}"

        for section in "${missing_sections[@]}"; do
            case "$section" in
                sprint)
                    cat >> "$CONFIG_FILE" <<'YAML'

sprint:
  duration_days: 14
  default_capacity: 21
  naming_pattern: "sprint-NNN"
YAML
                    ;;
                git)
                    cat >> "$CONFIG_FILE" <<'YAML'

git:
  commit_prefix: "[KANBAN]"
  auto_push: true
YAML
                    ;;
                subprojects)
                    cat >> "$CONFIG_FILE" <<'YAML'

subprojects:
  enabled: true
  projects_with_subprojects: []
YAML
                    ;;
                priorities)
                    cat >> "$CONFIG_FILE" <<'YAML'

priorities:
  - id: "critical"
    name: "Critical"
    order: 1
  - id: "high"
    name: "High"
    order: 2
  - id: "medium"
    name: "Medium"
    order: 3
  - id: "low"
    name: "Low"
    order: 4
YAML
                    ;;
                story_points)
                    cat >> "$CONFIG_FILE" <<'YAML'

story_points:
  allowed: [1, 2, 3, 5, 8, 13]
  max_single_task: 3
  epic_threshold: 5
  max_files_per_task: 5
YAML
                    ;;
                paths)
                    cat >> "$CONFIG_FILE" <<'YAML'

paths:
  board: "board"
  okrs: "okrs"
  sprints: "sprints"
  projects: "projects"
  templates: "templates"
  logs: "logs"
YAML
                    ;;
            esac
            updated=$(( updated + 1 ))
        done

        print_success "Added ${updated} missing section(s) to config.yaml"
    else
        print_success "config.yaml is up to date — no changes needed"
    fi

    print_next_steps
}

# ─── Next Steps ───────────────────────────────────────────────────────────────

print_next_steps() {
    echo
    echo -e "${BOLD}${GREEN}Setup complete!${NC}"
    echo
    echo -e "${BOLD}Next steps:${NC}"
    echo
    print_step "Review ${BOLD}config.yaml${NC} and customize as needed"
    print_step "Copy ${BOLD}templates/agents/en/implementer.md${NC} to your agent's config file"
    print_step "Install the bash library dependency: ${BOLD}yq${NC} v4+"
    print_info  "  https://github.com/mikefarah/yq — or: snap install yq"
    print_step "Source ${BOLD}scripts/lib/config.sh${NC} in your scripts"
    print_step "Run ${BOLD}scripts/kb.sh status${NC} to verify the setup"
    echo

    if [[ -d "${KANBAN_ROOT}/.git" ]]; then
        print_step "Commit your initial config:"
        print_info  "  git add config.yaml .gitignore board/"
        print_info  "  git commit -m 'chore: initialize kanbania'"
    fi
    echo
}

# ─── Help ─────────────────────────────────────────────────────────────────────

print_help() {
    cat <<HELP

${BOLD}Kanbania Setup Wizard${NC}

${BOLD}USAGE${NC}
    ./setup.sh [MODE]

${BOLD}MODES${NC}
    (none)          Interactive: asks whether to use quick or detailed mode
    --quick         Non-interactive quick setup with sensible defaults
    --detailed      Full interactive configuration of all options
    --from-config   Recreate board directories from existing config.yaml
    --upgrade       Merge new schema keys into existing config.yaml
    --help          Show this help message

${BOLD}EXAMPLES${NC}
    # First-time setup (interactive)
    ./setup.sh

    # CI / clone setup
    ./setup.sh --quick

    # After pulling new Kanbania version
    ./setup.sh --upgrade

    # Recover board dirs after accidental deletion
    ./setup.sh --from-config

HELP
}

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
    local mode="${1:-}"

    case "$mode" in
        --help|-h)
            print_help
            exit 0
            ;;
        --quick)
            print_header
            quick_mode
            ;;
        --detailed)
            print_header
            detailed_mode
            ;;
        --from-config)
            print_header
            print_section "Recreate from Config"
            from_config_mode
            ;;
        --upgrade)
            print_header
            print_section "Upgrade Config Schema"
            upgrade_mode
            ;;
        "")
            print_header
            echo -e "  Welcome to ${BOLD}Kanbania${NC} — the AI-native kanban system."
            echo
            if [[ -f "$CONFIG_FILE" ]]; then
                print_warning "Existing config.yaml found."
                echo
                local choice
                ask_choice choice "What would you like to do?" \
                    "Re-run detailed setup (overwrites config.yaml)" \
                    "Upgrade schema (add missing keys, non-destructive)" \
                    "Recreate board structure from existing config" \
                    "Exit"
                case "$choice" in
                    "Re-run detailed setup (overwrites config.yaml)")
                        echo
                        detailed_mode ;;
                    "Upgrade schema (add missing keys, non-destructive)")
                        echo
                        print_section "Upgrade Config Schema"
                        upgrade_mode ;;
                    "Recreate board structure from existing config")
                        echo
                        print_section "Recreate from Config"
                        from_config_mode ;;
                    *)
                        echo "Exiting."
                        exit 0 ;;
                esac
            else
                local mode_choice
                ask_choice mode_choice "Choose setup mode:" \
                    "Quick (defaults, 30 seconds)" \
                    "Detailed (full interactive configuration)"
                echo
                if [[ "$mode_choice" == "Quick (defaults, 30 seconds)" ]]; then
                    quick_mode
                else
                    detailed_mode
                fi
            fi
            ;;
        *)
            print_error "Unknown option: $mode"
            echo -e "  Run ${BOLD}./setup.sh --help${NC} for usage."
            exit 1
            ;;
    esac
}

main "$@"
