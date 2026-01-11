#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"
mkdir -p static-analysis/reports
npx hardhat --version >/dev/null 2>&1
npm run compile
slither . --hardhat-ignore-compile --json static-analysis/reports/All.json > static-analysis/reports/All.txt 2> static-analysis/reports/All.err.txt || true
declare -a names
names+=("DPToken")
names+=("GovernanceDAO")
names+=("CERTIFICATE")
names+=("REDEEM")
names+=("STAKE")
names+=("StableStaking")
for name in "${names[@]}"; do
  grep -E "\\b${name}\\." static-analysis/reports/All.err.txt > "static-analysis/reports/${name}.err.txt" || true
  grep -E "\\b${name}\\." static-analysis/reports/All.txt > "static-analysis/reports/${name}.txt" || true
done
