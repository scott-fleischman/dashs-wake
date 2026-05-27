#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() {
  printf '\n== %s ==\n' "$1"
}

failures=0

run_step() {
  local label="$1"
  shift
  step "$label"
  if "$@"; then
    printf 'PASS: %s\n' "$label"
  else
    printf 'FAIL: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

run_step "Typecheck and production build" npm run build
run_step "Agent gate unit tests" npm run test:agent
run_step "Browser smoke tests" npm run test:smoke

printf '\n'
if [[ "$failures" -gt 0 ]]; then
  printf 'Agent verification failed (%s step(s)).\n' "$failures" >&2
  printf 'Do not claim the change is complete or commit until this passes.\n' >&2
  exit 1
fi

printf 'Agent verification passed.\n'
