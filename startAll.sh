#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"

echo "========================================"
echo "Routine - Start All Services"
echo "Root: $ROOT_DIR"
echo "========================================"

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm not found. Please install Node.js and reopen the terminal."
  exit 1
fi

if [ ! -f "$ROOT_DIR/be/mvnw" ]; then
  echo "[ERROR] Backend wrapper not found: $ROOT_DIR/be/mvnw"
  exit 1
fi

check_port() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "sport = :$port" 2>/dev/null | tail -n +2 | grep -q .; then
      echo "[ERROR] Port $port is already in use."
      exit 1
    fi
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
      echo "[ERROR] Port $port is already in use."
      exit 1
    fi
    return
  fi

  echo "[WARN] Neither ss nor lsof is available; skipping port check for $port."
}

for port in 8080 5173 5174; do
  check_port "$port"
done

mkdir -p "$LOG_DIR"

start_service() {
  local name="$1"
  local directory="$2"
  local command_line="$3"
  local log_file="$4"

  local pid
  pid="$(cd "$directory" && nohup bash -lc "$command_line" > "$log_file" 2>&1 & echo $!)"
  echo "$name started (PID $pid). Log: $log_file"
}

echo "Starting backend on http://localhost:8080 ..."
start_service "Routine Backend" "$ROOT_DIR/be" "bash ./mvnw spring-boot:run" "$LOG_DIR/backend.log"

echo "Starting storefront on http://localhost:5173 ..."
start_service "Routine Storefront" "$ROOT_DIR/fe/storefront" "npm run dev -- --host 0.0.0.0 --port 5173" "$LOG_DIR/storefront.log"

echo "Starting admin on http://localhost:5174 ..."
start_service "Routine Admin" "$ROOT_DIR/fe/admin" "npm run dev -- --host 0.0.0.0 --port 5174" "$LOG_DIR/admin.log"

echo
echo "All services were launched in the background."
echo "Logs are available in: $LOG_DIR"


đ'