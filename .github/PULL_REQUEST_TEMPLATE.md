## Summary

<!-- Describe what this PR does and why. Link related issues with "Fixes #NNN" -->

Fixes #

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] Other:

## Changes

<!-- List the main files/components changed -->

-
-

## Testing

- [ ] `bash -n scripts/*.sh scripts/lib/*.sh` passes
- [ ] `bash scripts/test-config.sh` passes (if config.sh was changed)
- [ ] `./setup.sh --quick` works in a fresh directory
- [ ] Dashboard builds cleanly (`npm run build`) if dashboard was changed

## Checklist

- [ ] No hardcoded paths (grep for `/home/` returns zero matches in `scripts/`)
- [ ] `config.yaml` schema changes are backward-compatible or include migration notes
- [ ] New bash scripts source `lib/config.sh` and use `KANBAN_ROOT`
- [ ] PR is focused on one thing (not mixing multiple features)
