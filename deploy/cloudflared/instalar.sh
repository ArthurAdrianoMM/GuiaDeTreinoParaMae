#!/usr/bin/env bash
#
# Cria o tunel, aponta o DNS e sobe o servico. Rodar como root DEPOIS de
# `cloudflared tunnel login` - e' esse login que autoriza a zona.
#
#   bash /opt/treino/deploy/cloudflared/instalar.sh
#
# Pode rodar de novo sem medo: se o tunel ja' existe, reaproveita.

set -euo pipefail

NOME_TUNEL="treino"
HOSTNAME_PUBLICO="treinomae.arthuradriano.com"
CERT="/root/.cloudflared/cert.pem"
DESTINO="/etc/cloudflared"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ $EUID -eq 0 ]] || { echo "Precisa ser root."; exit 1; }

if [[ ! -f "$CERT" ]]; then
  echo "Falta $CERT."
  echo "Rode primeiro:  cloudflared tunnel login"
  exit 1
fi

# 1. Tunel (idempotente)
if cloudflared tunnel list --output json | grep -q "\"name\":\"$NOME_TUNEL\""; then
  echo "Tunel '$NOME_TUNEL' ja' existe - reaproveitando."
else
  echo "Criando tunel '$NOME_TUNEL'..."
  cloudflared tunnel create "$NOME_TUNEL"
fi

UUID="$(cloudflared tunnel list --output json \
  | node -e 'let e="";process.stdin.on("data",d=>e+=d).on("end",()=>{
      const t=JSON.parse(e).find(t=>t.name===process.argv[1]);
      if(!t){console.error("tunel nao encontrado");process.exit(1)}
      process.stdout.write(t.id)})' "$NOME_TUNEL")"
echo "UUID: $UUID"

CREDENCIAL="/root/.cloudflared/${UUID}.json"
[[ -f "$CREDENCIAL" ]] || { echo "Falta a credencial $CREDENCIAL"; exit 1; }

# 2. Usuario de servico: nao escreve nada, so' le' a configuracao.
id -u cloudflared >/dev/null 2>&1 || \
  adduser --system --group --no-create-home --home /nonexistent cloudflared

# 3. Configuracao e credencial em /etc/cloudflared
install -d -o root -g cloudflared -m 750 "$DESTINO"
install -o root -g cloudflared -m 640 "$CREDENCIAL" "$DESTINO/${UUID}.json"
sed "s|UUID-DO-TUNEL|$UUID|g" "$REPO/config.yml" > "$DESTINO/config.yml"
chown root:cloudflared "$DESTINO/config.yml"
chmod 640 "$DESTINO/config.yml"

# 4. DNS: cria o CNAME proxied na Cloudflare (--overwrite-dns torna reexecutavel)
echo "Apontando $HOSTNAME_PUBLICO para o tunel..."
cloudflared tunnel route dns --overwrite-dns "$NOME_TUNEL" "$HOSTNAME_PUBLICO"

# 5. Servico
install -m 644 "$REPO/../cloudflared.service" /etc/systemd/system/cloudflared.service
systemctl daemon-reload
systemctl enable --now cloudflared.service
sleep 3
systemctl --no-pager --lines=15 status cloudflared.service || true

echo
echo "Pronto. Teste:  curl -sS https://$HOSTNAME_PUBLICO/api/saude"
