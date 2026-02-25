# Contributing to Kanbania

Thank you for your interest in contributing! This document outlines the process for contributing to Kanbania.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<you>/kanbania`
3. Run the setup wizard: `./setup.sh --quick`
4. Create a feature branch: `git checkout -b feat/your-feature`

## How to Contribute

### Bug Reports

Open an issue using the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, shell version, yq version)

### Feature Requests

Open an issue using the **Feature Request** template. Describe:
- The problem you are solving
- Your proposed solution
- Alternatives you considered

### Pull Requests

1. Keep PRs focused — one feature or fix per PR
2. Add tests if you are changing `scripts/lib/config.sh` or `setup.sh`
3. Update `config.yaml` comments if you are changing the schema
4. Follow existing code style (bash: `set -euo pipefail`, POSIX where possible)
5. Run `bash -n scripts/*.sh` to validate syntax before submitting

### Commit Messages

Follow the format used throughout the project:

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

## Development Setup

```bash
# Dependencies
# - bash 4.4+
# - yq v4+ (https://github.com/mikefarah/yq)
# - node 18+ (for dashboard only)

# Run the setup wizard
./setup.sh

# Validate bash scripts
bash -n scripts/*.sh scripts/lib/*.sh

# Run the config test suite
bash scripts/test-config.sh

# Build the dashboard (optional)
cd dashboard && npm install && npm run build
```

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to follow it.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
