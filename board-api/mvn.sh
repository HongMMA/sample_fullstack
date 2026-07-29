#!/usr/bin/env bash
# 로컬 기본 java가 8이라 JDK 21을 잡아주는 Maven 래퍼입니다.
# 예:
#   ./mvn.sh spring-boot:run
#   ./mvn.sh exec:exec@db-up
#   ./mvn.sh exec:exec@db-down
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 셸에 JAVA_HOME이 Java 8로 잡혀 있어도 JDK 21/17을 강제한다.
if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || true)"
fi

if [[ -z "${JAVA_HOME:-}" || ! -x "$JAVA_HOME/bin/java" ]]; then
  echo "JDK 17+ 가 필요합니다. JAVA_HOME을 설정해 주세요."
  exit 1
fi

if command -v mvn >/dev/null 2>&1; then
  MAVEN_BIN="$(command -v mvn)"
elif [[ -x "$HOME/apache-maven-3.9.9/bin/mvn" ]]; then
  MAVEN_BIN="$HOME/apache-maven-3.9.9/bin/mvn"
else
  echo "Maven(mvn)을 찾을 수 없습니다."
  exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"
exec "$MAVEN_BIN" "$@"
