#!/usr/bin/env bash
#
# Local CodeQL scan script for the Chat Components TypeScript + Vite library.
#
# This script:
#   1. Ensures dependencies are installed (npm ci) unless skipped.
#   2. Optionally prunes noisy folders inside node_modules to reduce DB size.
#   3. Creates (or re-creates) a CodeQL database using codeql-config.yml.
#   4. Analyzes the database with the standard JavaScript code scanning suite
#      plus extended security & quality queries defined in the config file.
#   5. Produces a SARIF report you can open in VS Code (SARIF Viewer) or upload.
#
# Prerequisites:
#   - CodeQL CLI installed and available in PATH (https://github.com/github/codeql-cli-binaries)
#   - Node.js matching engines spec in package.json (>=22.1.0)
#
# Usage examples:
#   ./scripts/codeql-scan.sh
#   BUILD=false PRUNE=false ./scripts/codeql-scan.sh
#   CODEQL=/opt/codeql/codeql DB_DIR=custom-db ./scripts/codeql-scan.sh
#
# Common environment variable overrides:
#   CODEQL            Path to CodeQL CLI (default: codeql)
#   DB_DIR            Database output directory (default: codeql-db)
#   RESULTS           SARIF output file (default: codeql-results.sarif)
#   CONFIG_FILE       CodeQL config file (default: codeql-config.yml)
#   LANGUAGE          Language for extraction (default: javascript)
#   BUILD             If "true", run npm run build for the create step (default: true)
#   INSTALL_DEPS      If "true", run npm ci first (default: true)
#   PRUNE             If "true", remove certain large/noisy folders from node_modules (default: true)
#   CLEAN             If "true", delete existing DB + SARIF before running (default: true)
#   EXTRA_QUERIES     Space-separated extra .ql or .qls files/packs to run (default: none)
#   THREADS           Threads for analysis (default: 0 -> use all cores)
#   VERBOSE           If "true", enable bash xtrace for debugging (default: false)
#
# Exit codes:
#   0 success
#   1 general error
#   2 missing prerequisite (CodeQL or Node)
#   3 failed database creation
#   4 failed analysis
#   5 config file missing
#

set -euo pipefail

# -- Configuration defaults ----------------------------------------------------
CODEQL="${CODEQL:-codeql}"
DB_DIR="${DB_DIR:-codeql-db}"
RESULTS="${RESULTS:-codeql-results.sarif}"
CONFIG_FILE="${CONFIG_FILE:-codeql-config.yml}"
LANGUAGE="${LANGUAGE:-javascript}"
BUILD="${BUILD:-true}"
INSTALL_DEPS="${INSTALL_DEPS:-true}"
PRUNE="${PRUNE:-true}"
CLEAN="${CLEAN:-true}"
EXTRA_QUERIES="${EXTRA_QUERIES:-}"
THREADS="${THREADS:-0}"
VERBOSE="${VERBOSE:-false}"

# ------------------------------------------------------------------------------
usage() {
  cat <<'EOF'
Local CodeQL scan for Chat Components.

Options (environment variables):
  CODEQL=/path/to/codeql            Override CodeQL CLI path
  DB_DIR=dir                        Database directory name
  RESULTS=report.sarif              SARIF output file
  CONFIG_FILE=codeql-config.yml     CodeQL config file
  LANGUAGE=javascript               Extraction language (JS covers TS)
  BUILD=true|false                  Run npm run build before extraction
  INSTALL_DEPS=true|false           Run npm ci before build
  PRUNE=true|false                  Remove large/noisy dirs in node_modules
  CLEAN=true|false                  Remove existing DB & SARIF before run
  EXTRA_QUERIES="file.ql pack.qls"  Additional queries/packs to run
  THREADS=0                         Threads for analysis (0 = all)
  VERBOSE=true|false                Bash debug output

Examples:
  ./scripts/codeql-scan.sh
  BUILD=false PRUNE=false ./scripts/codeql-scan.sh
  EXTRA_QUERIES="codeql/javascript-queries:Suspicious" ./scripts/codeql-scan.sh

EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$VERBOSE" == "true" ]]; then
  set -x
fi

echo "[*] CodeQL scan starting..."

# -- Prerequisite checks -------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js not found in PATH." >&2
  exit 2
fi

if ! command -v "$CODEQL" >/dev/null 2>&1; then
  echo "[!] CodeQL CLI '$CODEQL' not found in PATH." >&2
  echo "    Install from: https://github.com/github/codeql-cli-binaries" >&2
  exit 2
fi

# Confirm config exists
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "[!] Config file '$CONFIG_FILE' not found. Expected at project root." >&2
  exit 5
fi

# Show basic versions
NODE_VERSION=$(node --version || echo "unknown")
CODEQL_VERSION=$("$CODEQL" version || echo "unknown")
echo "[*] Node version:    $NODE_VERSION"
echo "[*] CodeQL version:  $CODEQL_VERSION"

# -- Optional dependency install -----------------------------------------------
if [[ "$INSTALL_DEPS" == "true" ]]; then
  echo "[*] Installing dependencies (npm ci)..."
  npm ci
else
  echo "[*] Skipping dependency installation."
fi

# -- Optional build step -------------------------------------------------------
BUILD_CMD="true"
if [[ "$BUILD" == "true" ]]; then
  echo "[*] Running build (npm run build)..."
  npm run build
  BUILD_CMD="npm run build"
else
  echo "[*] Skipping build step (using 'true' as command)."
fi

# -- Optional pruning inside node_modules --------------------------------------
if [[ "$PRUNE" == "true" ]]; then
  echo "[*] Pruning selected folders in node_modules to reduce DB size..."
  # Only prune if directory exists
  if [[ -d node_modules ]]; then
    # Remove common large/noisy directories (leave -prune so traversal is cheaper)
    find node_modules -type d \( \
        -name coverage -o -name dist -o -name build -o -name lib -o \
        -name examples -o -name example -o -name tests -o -name test -o \
        -name __tests__ -o -name fixtures -o -name benchmark -o -name bench \
      \) -prune -exec rm -rf {} + 2>/dev/null || true
  else
    echo "[!] node_modules not present; skipping prune."
  fi
else
  echo "[*] Skipping prune."
fi

# -- Clean previous artifacts --------------------------------------------------
if [[ "$CLEAN" == "true" ]]; then
  echo "[*] Removing previous database ($DB_DIR) and SARIF ($RESULTS) if they exist..."
  rm -rf "$DB_DIR" "$RESULTS"
else
  echo "[*] CLEAN=false: preserving existing database/results if present."
fi

# -- Database creation ---------------------------------------------------------
echo "[*] Creating CodeQL database..."
set +e
"$CODEQL" database create "$DB_DIR" \
  --language="$LANGUAGE" \
  --source-root="." \
  --codescanning-config="$CONFIG_FILE" \
  --command="$BUILD_CMD"
CREATE_EXIT=$?
set -e

if [[ $CREATE_EXIT -ne 0 ]]; then
  echo "[!] Database creation failed (exit code $CREATE_EXIT)." >&2
  exit 3
fi
echo "[*] Database created at $DB_DIR"

# -- Query suite construction --------------------------------------------------
QUERY_SUITE="javascript-code-scanning.qls"
ANALYZE_ARGS=("$DB_DIR" "$QUERY_SUITE")

# Always leverage config queries (security-extended & security-and-quality)
# EXTRA_QUERIES appended if provided.
if [[ -n "$EXTRA_QUERIES" ]]; then
  echo "[*] Adding extra queries/packs: $EXTRA_QUERIES"
  # Split on spaces
  read -r -a EXTRA_ARRAY <<<"$EXTRA_QUERIES"
  ANALYZE_ARGS+=("${EXTRA_ARRAY[@]}")
fi

# -- Analysis ------------------------------------------------------------------
echo "[*] Analyzing database (threads=$THREADS)..."
set +e
"$CODEQL" database analyze "${ANALYZE_ARGS[@]}" \
  --format=sarifv2.1.0 \
  --output="$RESULTS" \
  --threads="$THREADS"
ANALYZE_EXIT=$?
set -e

if [[ $ANALYZE_EXIT -ne 0 ]]; then
  echo "[!] Analysis failed (exit code $ANALYZE_EXIT)." >&2
  exit 4
fi
echo "[*] Analysis complete. SARIF report: $RESULTS"

# -- Metadata summary ----------------------------------------------------------
echo "[*] Database metadata (source file counts):"
"$CODEQL" database print-metadata "$DB_DIR" | grep -E '"sourceFiles"|language' || true

echo "[*] Done."
exit 0
