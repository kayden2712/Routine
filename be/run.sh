#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MVNW="$ROOT_DIR/mvnw"

if [ ! -x "$MVNW" ]; then
  echo "[ERROR] Maven wrapper not found or not executable: $MVNW"
  exit 1
fi

case "${1:-run}" in
  run)
    exec "$MVNW" spring-boot:run
    ;;
  build)
    exec "$MVNW" clean package
    ;;
  test)
    exec "$MVNW" test
    ;;
  *)
    echo "Usage: $(basename "$0") [run|build|test]"
    exit 1
    ;;
esac
