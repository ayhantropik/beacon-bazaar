#!/usr/bin/env bash
# VeniVidiCoop dev sunucusu — herhangi bir ağdan çalışır:
#   - Backend (port 4000) + localtunnel ile public URL
#   - Expo Tunnel (port 8081) ile public URL
#   - env.ts otomatik güncellenir
#   - QR Preview'da açılır
#
# Kullanım: ./scripts/start-mobile.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ENV_FILE="$ROOT/apps/mobile/src/config/env.ts"

echo -e "${CYAN}▶ Mevcut sunucular durduruluyor...${NC}"
lsof -ti:4000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
lsof -ti:8081 2>/dev/null | xargs -r kill -9 2>/dev/null || true
pkill -f "lt --port" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

# Backend
echo -e "${CYAN}▶ Backend başlatılıyor (port 4000)...${NC}"
cd "$ROOT/apps/backend"
nohup "$ROOT/node_modules/.bin/nest" start --watch > /tmp/backend.log 2>&1 &

# Backend ready bekle
echo -e "${CYAN}▶ Backend hazır olmasını bekliyorum...${NC}"
for i in {1..60}; do
  if curl -sf http://localhost:4000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✔ Backend hazır${NC}"
    break
  fi
  sleep 1
done

# Backend public tunnel — Cloudflare quick tunnel (kararlı)
echo -e "${CYAN}▶ Backend için public tunnel açılıyor (cloudflared)...${NC}"
rm -f /tmp/cf-tunnel.log
nohup cloudflared tunnel --url http://localhost:4000 > /tmp/cf-tunnel.log 2>&1 &
BACKEND_TUNNEL=""
for i in {1..30}; do
  BACKEND_TUNNEL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-tunnel.log | head -1 || true)
  if [ -n "$BACKEND_TUNNEL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$BACKEND_TUNNEL" ]; then
  echo -e "${YELLOW}⚠ Backend tunnel açılamadı, LAN IP kullanılacak${NC}"
  LOCAL_IP=$(ifconfig en0 2>/dev/null | grep "inet " | awk '{print $2}')
  BACKEND_URL="http://${LOCAL_IP:-localhost}:4000/api/v1"
else
  BACKEND_URL="${BACKEND_TUNNEL}/api/v1"
  echo -e "${GREEN}✔ Backend public: $BACKEND_TUNNEL${NC}"
  # Tunnel readyness bekle
  for i in {1..15}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_TUNNEL/api/v1/health" --max-time 8)
    if [ "$code" = "200" ]; then
      echo -e "${GREEN}✔ Backend tunnel response: 200${NC}"
      break
    fi
    sleep 2
  done
fi

# env.ts'i güncelle
echo -e "${CYAN}▶ env.ts güncelleniyor: $BACKEND_URL${NC}"
python3 <<PYEOF
import re
path = "$ENV_FILE"
with open(path) as f:
    src = f.read()
new = re.sub(
    r"apiBaseUrl: __DEV__ \? '[^']+' :",
    "apiBaseUrl: __DEV__ ? '$BACKEND_URL' :",
    src,
)
with open(path, 'w') as f:
    f.write(new)
print('✓ env.ts updated')
PYEOF

# Expo tunnel
echo -e "${CYAN}▶ Expo tunnel başlatılıyor (30-60 sn)...${NC}"
cd "$ROOT/apps/mobile"
rm -rf .expo node_modules/.cache 2>/dev/null || true
EXPO_NO_METRO_WORKSPACE_ROOT=1 nohup "$ROOT/node_modules/.bin/expo" start --tunnel --clear --port 8081 > /tmp/expo-mobile.log 2>&1 &

# Expo tunnel URL bekle
TUNNEL_URL=""
for i in {1..90}; do
  TUNNEL_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    for t in d.get('tunnels', []):
        if 'https' in t.get('public_url', ''):
            print(t['public_url']); break
except: pass
" 2>/dev/null)
  if [ -n "$TUNNEL_URL" ]; then break; fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo -e "${YELLOW}⚠ Expo tunnel URL alınamadı${NC}"
  exit 1
fi

EXPO_URL="${TUNNEL_URL/https:\/\//exp:\/\/}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  HAZIR — Herhangi bir ağdan çalışır!                          ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Expo URL:${NC}    $EXPO_URL"
echo -e "${GREEN}║${NC}  ${CYAN}Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if command -v qrencode > /dev/null 2>&1; then
  qrencode -s 30 -m 6 -o /tmp/qr-mobile.png "$EXPO_URL"
  open /tmp/qr-mobile.png
  echo -e "${GREEN}✔ QR Preview'da açıldı — iPhone kameranla tara${NC}"
fi

echo ""
echo -e "${CYAN}Loglar:${NC}"
echo -e "  Backend  : tail -f /tmp/backend.log"
echo -e "  CF       : tail -f /tmp/cf-tunnel.log"
echo -e "  Expo     : tail -f /tmp/expo-mobile.log"
echo ""
echo -e "${CYAN}Durdurmak için: pkill -f 'cloudflared'; lsof -ti:4000,8081 | xargs kill -9${NC}"
