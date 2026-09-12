#!/usr/bin/env bash
#
# Atualiza o app para o ultimo commit de main e reinicia a API.
#
#   pct exec 101 -- /opt/treino/deploy/atualizar.sh
#
# Mudanca so' em public/ (ficha, videos, CSS) ja' vale no proximo carregamento:
# o restart abaixo e' para o servidor, nao para o estatico.

set -euo pipefail

RAIZ="/opt/treino"
[[ $EUID -eq 0 ]] || { echo "Precisa ser root."; exit 1; }

cd "$RAIZ"
echo "antes:  $(git -C "$RAIZ" rev-parse --short HEAD)  $(git -C "$RAIZ" log -1 --format=%s)"

# --ff-only: se alguem editou um arquivo no servidor, o pull para em vez de
# criar um merge silencioso. O servidor e' copia do repositorio, nao um lugar
# onde se edita.
sudo -u treino git -C "$RAIZ" pull --ff-only

echo "depois: $(git -C "$RAIZ" rev-parse --short HEAD)  $(git -C "$RAIZ" log -1 --format=%s)"

systemctl restart treino
sleep 1
systemctl is-active --quiet treino || { echo "FALHOU - veja: journalctl -u treino -n 50"; exit 1; }

curl -fsS localhost:3000/api/saude && echo
echo "atualizado."
