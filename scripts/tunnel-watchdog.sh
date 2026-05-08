#!/usr/bin/env bash
# Cloudflare quick tunnel watchdog.
# Tunnel her 30 saniyede health check yapar, düşerse otomatik yeniden başlatır
# ve env.ts'yi yeni URL ile günceller.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_TS_FILE="$ROOT/apps/mobile/src/config/env.ts"
DOTENV_FILE="$ROOT/apps/mobile/.env"
LOG_FILE="/tmp/cf-tunnel.log"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

start_tunnel() {
  pkill -f "cloudflared tunnel" 2>/dev/null
  sleep 2
  rm -f "$LOG_FILE"
  nohup cloudflared tunnel --url http://localhost:4000 --no-autoupdate > "$LOG_FILE" 2>&1 &

  # URL bekle
  for i in {1..30}; do
    URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOG_FILE" 2>/dev/null | head -1)
    if [ -n "$URL" ]; then
      sleep 5
      code=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/v1/health" --max-time 8)
      if [ "$code" = "200" ]; then
        echo -e "${GREEN}[$(date +%H:%M:%S)] Tunnel UP: $URL${NC}"
        # env.ts'yi güncelle (legacy fallback için)
        python3 - <<PYEOF
import re, os
ts = "$ENV_TS_FILE"
if os.path.exists(ts):
    with open(ts) as f: src = f.read()
    new = re.sub(r"apiBaseUrl: __DEV__ \? '[^']+' :", "apiBaseUrl: __DEV__ ? '$URL/api/v1' :", src)
    if new != src:
        with open(ts, 'w') as f: f.write(new)
# .env dosyasını güncelle (Expo Constants.expoConfig.extra için)
de = "$DOTENV_FILE"
if os.path.exists(de):
    with open(de) as f: src = f.read()
    new = re.sub(r"^API_BASE_URL_LOCAL=.*$", "API_BASE_URL_LOCAL=$URL/api/v1", src, flags=re.MULTILINE)
    if new != src:
        with open(de, 'w') as f: f.write(new)
PYEOF
        # Mevcut URL'i bir state dosyasına yaz
        echo "$URL" > /tmp/cf-tunnel-current-url
        return 0
      fi
    fi
    sleep 1
  done
  echo -e "${RED}[$(date +%H:%M:%S)] Tunnel başlatılamadı${NC}"
  return 1
}

check_tunnel() {
  local url="$1"
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/v1/health" --max-time 8)
  if [ "$code" = "200" ]; then
    return 0
  fi
  return 1
}

# İlk başlangıç — eğer mevcut tunnel hâlâ canlıysa yeniden başlatma (URL koru)
echo -e "${YELLOW}Cloudflare tunnel watchdog başlatılıyor...${NC}"
EXISTING=$(cat /tmp/cf-tunnel-current-url 2>/dev/null)
if [ -n "$EXISTING" ] && check_tunnel "$EXISTING"; then
  echo -e "${GREEN}[$(date +%H:%M:%S)] Mevcut tunnel canlı: $EXISTING (yeniden başlatılmıyor)${NC}"
  # .env'i her ihtimale karşı sync et
  python3 - <<PYEOF
import re, os
de = "$DOTENV_FILE"
if os.path.exists(de):
    with open(de) as f: src = f.read()
    new = re.sub(r"^API_BASE_URL=.*$", "API_BASE_URL=$EXISTING/api/v1", src, flags=re.MULTILINE)
    if new != src:
        with open(de, 'w') as f: f.write(new)
PYEOF
else
  start_tunnel || exit 1
fi

# Sürekli izle
while true; do
  sleep 30
  CURRENT=$(cat /tmp/cf-tunnel-current-url 2>/dev/null)
  if [ -z "$CURRENT" ] || ! check_tunnel "$CURRENT"; then
    echo -e "${YELLOW}[$(date +%H:%M:%S)] Tunnel düştü, yeniden başlatılıyor...${NC}"
    start_tunnel || sleep 10
  fi
done
