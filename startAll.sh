#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
MYSQL_HOST="localhost"

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

check_mysql() {
  is_tcp_open() {
    local host="$1"
    local port="$2"
    timeout 2 bash -lc "</dev/tcp/$host/$port" >/dev/null 2>&1
  }

  if is_tcp_open "127.0.0.1" 3306; then
    MYSQL_HOST="localhost"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    if docker ps --filter "name=^/routine-mysql$" --filter "status=running" --format '{{.Names}}' | grep -qx 'routine-mysql'; then
      local container_ip
      container_ip="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' routine-mysql 2>/dev/null || true)"
      if [ -n "$container_ip" ] && is_tcp_open "$container_ip" 3306; then
        MYSQL_HOST="$container_ip"
        return
      fi
    fi

    echo "[ERROR] MySQL is not reachable from current shell."
    echo "[HINT] If using Docker MySQL, start it with: docker compose -f docker-compose.mysql.yml up -d mysql"
    echo "[HINT] You can also set DB_HOST manually before running this script."
    exit 1
  fi

  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "sport = :3306" 2>/dev/null | tail -n +2 | grep -q .; then
      return
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:3306 -sTCP:LISTEN -Pn >/dev/null 2>&1; then
      return
    fi
  fi

  echo "[ERROR] MySQL is not reachable from current shell."
  echo "[HINT] Start MySQL and/or set DB_HOST manually before running this script."
  exit 1
}

ensure_docker_mysql_credentials() {
  if ! command -v docker >/dev/null 2>&1; then
    return
  fi

  if ! docker ps --filter "name=^/routine-mysql$" --filter "status=running" --format '{{.Names}}' | grep -qx 'routine-mysql'; then
    return
  fi

  echo "Ensuring routine-mysql credentials (routine_user / routine_db) ..."
  if ! docker exec routine-mysql mysql -uroot -p12345 -e "CREATE DATABASE IF NOT EXISTS routine_db; CREATE USER IF NOT EXISTS 'routine_user'@'localhost' IDENTIFIED BY '12345'; CREATE USER IF NOT EXISTS 'routine_user'@'%' IDENTIFIED BY '12345'; ALTER USER 'routine_user'@'localhost' IDENTIFIED BY '12345'; ALTER USER 'routine_user'@'%' IDENTIFIED BY '12345'; GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'localhost'; GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'%'; FLUSH PRIVILEGES;" >/dev/null 2>&1; then
    echo "[WARN] Cannot auto-sync credentials in routine-mysql."
    echo "[HINT] Verify root password in docker-compose.mysql.yml (MYSQL_ROOT_PASSWORD)."
  fi
}

TERMINAL_EMULATOR=""
if command -v foot >/dev/null 2>&1; then
  TERMINAL_EMULATOR="foot"
elif command -v kitty >/dev/null 2>&1; then
  TERMINAL_EMULATOR="kitty"
elif command -v alacritty >/dev/null 2>&1; then
  TERMINAL_EMULATOR="alacritty"
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

check_mysql
ensure_docker_mysql_credentials
echo "Using MySQL host: $MYSQL_HOST"

mkdir -p "$LOG_DIR"

start_service() {
  local name="$1"
  local directory="$2"
  local command_line="$3"
  local log_file="$4"

  if [ -n "$TERMINAL_EMULATOR" ]; then
    local runner
    runner="$(mktemp "$LOG_DIR/${name// /_}.XXXXXX.sh")"
    cat > "$runner" <<EOF
#!/usr/bin/env bash
set -euo pipefail

cd "$directory"
$command_line 2>&1 | tee "$log_file"
status=\${PIPESTATUS[0]}
echo
echo "$name exited with status \$status"
exec bash
EOF
    chmod +x "$runner"

    case "$TERMINAL_EMULATOR" in
      foot)
        foot --title "$name" --working-directory "$directory" bash "$runner" >/dev/null 2>&1 &
        ;;
      kitty)
        kitty --title "$name" bash "$runner" >/dev/null 2>&1 &
        ;;
      alacritty)
        alacritty --title "$name" --working-directory "$directory" -e bash "$runner" >/dev/null 2>&1 &
        ;;
    esac

    echo "$name started in a separate window. Log: $log_file"
    return
  fi

  local pid
  pid="$(cd "$directory" && nohup bash -lc "$command_line" > "$log_file" 2>&1 & echo $!)"
  echo "$name started (PID $pid). Log: $log_file"
}

echo "Starting backend on http://localhost:8080 ..."
start_service "Routine Backend" "$ROOT_DIR/be" "DB_HOST=$MYSQL_HOST bash ./mvnw spring-boot:run" "$LOG_DIR/backend.log"

echo "Starting storefront on http://localhost:5173 ..."
start_service "Routine Storefront" "$ROOT_DIR/fe/storefront" "npm run dev -- --host 0.0.0.0 --port 5173" "$LOG_DIR/storefront.log"

echo "Starting admin on http://localhost:5174 ..."
start_service "Routine Admin" "$ROOT_DIR/fe/admin" "npm run dev -- --host 0.0.0.0 --port 5174" "$LOG_DIR/admin.log"

echo
if [ -n "$TERMINAL_EMULATOR" ]; then
  echo "All services were launched in separate windows using $TERMINAL_EMULATOR."
else
  echo "All services were launched in the background."
fi
echo "Logs are available in: $LOG_DIR"
