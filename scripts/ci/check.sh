#!/usr/bin/env bash
set -euo pipefail
source scripts/ci/env.sh
bunx biome ci .
bun run check
bun run test
bun run build
