# Deploy — LXC no Proxmox + Cloudflare Tunnel

Requisito único: **Node.js 22.5 ou superior** (usa o SQLite embutido, `node:sqlite`).
Não existe `npm install` — o backend não tem dependências.

## Como isto fica montado

```
celular (dados móveis) → borda da Cloudflare · TLS · treinomae.arthuradriano.com
                              ↕ túnel de saída — nenhuma porta aberta no roteador
Proxmox "homeserver" (onboot)
└── LXC 101 "treino" — Debian 13, sem privilégio, 1 vCPU / 512 MB / 8 GB
    ├── cloudflared.service → 127.0.0.1:80
    ├── nginx.service       → /opt/treino/public  +  /api/ → :3000
    └── treino.service      → node src/server.js @ 127.0.0.1:3000
                              banco: /var/lib/treino/treino.db
```

Nada dentro do container escuta numa interface roteável. A única entrada é o túnel;
a única forma de administrar é `pct exec` a partir do host.

**Por que túnel e não certbot:** não abre porta no roteador, não depende de IP fixo,
não expõe o IP de casa e não tem certificado para renovar — a Cloudflare cuida do TLS.
O preço é que o token `?k=` passa pela borda deles e aparece no log de requisições.

**Volta sozinha depois de queda de energia:** o host liga → o LXC tem `onboot=1` →
o systemd sobe `treino`, `nginx` e `cloudflared`, todos com `Restart=always` →
o cloudflared disca para fora e o endereço volta ao ar. Nenhum passo manual.

---

## 1. Criar o container

No host Proxmox:

```sh
pct create 101 local:vztmpl/debian-13-standard_13.1-2_amd64.tar.zst \
  --hostname treino --unprivileged 1 \
  --cores 1 --memory 512 --swap 512 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.0.12/24,gw=192.168.0.1 \
  --nameserver 1.1.1.1 \
  --onboot 1 --startup order=5,up=30 \
  --features nesting=1

pct start 101
```

`--onboot 1` é o primeiro elo da corrente de religar sozinho.
`nesting=1` é o que permite o systemd rodar direito num container sem privilégio.

## 2. Preparar o sistema

```sh
pct exec 101 -- bash -c '
  apt update && apt upgrade -y
  apt install -y curl ca-certificates gnupg git nginx sudo

  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt install -y nodejs
  node -v    # precisa ser >= 22.5

  adduser --system --group --no-create-home --home /opt/treino treino
'
```

## 3. Trazer o código

O repositório é público — nenhuma chave, nenhum token.

```sh
pct exec 101 -- bash -c '
  git clone https://github.com/ArthurAdrianoMM/GuiaDeTreinoParaMae.git /opt/treino
  mkdir -p /var/lib/treino /var/backups/treino
  chown -R treino:treino /opt/treino /var/lib/treino /var/backups/treino
  chmod 750 /var/lib/treino
'
```

## 4. Criar a usuária e pegar o link

```sh
pct exec 101 -- bash -c '
  cd /opt/treino/server
  BANCO=/var/lib/treino/treino.db sudo -u treino -E \
    node scripts/criar-usuario.js "Mãe" ficha-mae-2026-01 https://treinomae.arthuradriano.com
'
```

Guarde o link impresso. **O link é a senha:** quem tiver o link entra.
Mande por WhatsApp direto para ela, não em grupo, e não cole em issue nem em commit.

## 5. Subir API, backup e nginx

```sh
pct exec 101 -- bash -c '
  cp /opt/treino/deploy/treino.service        /etc/systemd/system/
  cp /opt/treino/deploy/treino-backup.service /etc/systemd/system/
  cp /opt/treino/deploy/treino-backup.timer   /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable --now treino.service treino-backup.timer

  cp /opt/treino/deploy/nginx.conf /etc/nginx/sites-available/treino
  ln -sf /etc/nginx/sites-available/treino /etc/nginx/sites-enabled/treino
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl enable --now nginx && systemctl reload nginx

  curl -fsS localhost:3000/api/saude; echo
  curl -fsS -o /dev/null -w "nginx: %{http_code}\n" localhost/
'
```

## 6. O túnel

Instalar o cloudflared:

```sh
pct exec 101 -- bash -c '
  mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    -o /usr/share/keyrings/cloudflare-main.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" \
    > /etc/apt/sources.list.d/cloudflared.list
  apt update && apt install -y cloudflared
'
```

Autorizar a zona — **este passo precisa de um navegador**:

```sh
pct exec 101 -- cloudflared tunnel login
```

Ele imprime uma URL. Abra no navegador, entre na conta Cloudflare e escolha
a zona `arthuradriano.com`. Isso grava `/root/.cloudflared/cert.pem` no container.

Depois, um comando só faz o resto (cria o túnel, escreve a configuração,
cria o CNAME e sobe o serviço):

```sh
pct exec 101 -- bash /opt/treino/deploy/cloudflared/instalar.sh
```

## 7. Ajustes no painel da Cloudflare

Na zona `arthuradriano.com`:

| Onde | Valor | Por quê |
|------|-------|---------|
| SSL/TLS → Overview | **Full (strict)** | evita modo Flexible, que serviria o app em http por dentro |
| SSL/TLS → Edge Certificates → Always Use HTTPS | **ligado** | http vira https antes de chegar aqui |
| Speed → Optimization → Rocket Loader | **desligado** | reescreve o carregamento de script e quebra os módulos ES do app |
| Caching → Cache Rules | bypass em `/api/*` | a API nunca deve ser servida de cache |

O registro DNS já foi criado pelo `instalar.sh`, proxied (nuvem laranja).

## 8. Conferir

```sh
curl -sS https://treinomae.arthuradriano.com/api/saude
curl -sS -H "Authorization: Bearer SEU-TOKEN" https://treinomae.arthuradriano.com/api/eu
```

Abrir o link com `?k=` no celular → **Compartilhar → Adicionar à Tela de Início**.

E o teste que realmente importa — reiniciar o host e ver tudo voltar sozinho:

```sh
# no host Proxmox
reboot
# depois que voltar:
pct status 101
pct exec 101 -- systemctl is-active treino nginx cloudflared
curl -sS https://treinomae.arthuradriano.com/api/saude
```

---

## Operação

Tudo pelo host, sem SSH para dentro do container:

```sh
pct exec 101 -- journalctl -u treino -f          # logs da API
pct exec 101 -- journalctl -u cloudflared -n 50  # estado do túnel
pct exec 101 -- systemctl restart treino
pct exec 101 -- systemctl list-timers treino-backup
pct exec 101 -- systemctl start treino-backup.service   # backup agora
pct enter 101                                    # shell, quando precisar
```

### Atualizar o código

Commit e push no seu computador, depois:

```sh
pct exec 101 -- /opt/treino/deploy/atualizar.sh
```

O script mostra o commit antes e depois, reinicia a API e confere a saúde.
Ele usa `git pull --ff-only` de propósito: o servidor é cópia do repositório,
não um lugar onde se edita.

### Trocar a ficha quando o professor passar a nova

1. Criar `public/data/fichas/ficha-mae-2026-03.json`, commit e push
2. `pct exec 101 -- /opt/treino/deploy/atualizar.sh`
3. Apontar a usuária para ela:

```sh
pct exec 101 -- bash -c "cd /opt/treino/server && sudo -u treino BANCO=/var/lib/treino/treino.db node -e \"
import('./src/db.js').then(({abrirBanco}) => {
  const db = abrirBanco(process.env.BANCO);
  db.prepare('UPDATE usuarios SET ficha_ativa = ? WHERE id = ?').run('ficha-mae-2026-03', 1);
  console.log('ficha atualizada');
});\""
```

A ficha antiga continua no repositório — o histórico dela permanece interpretável.

### Backup — três camadas

1. **`treino-backup.timer`**, diário, dentro do container: cópia consistente do
   `.db` em `/var/backups/treino`, 30 dias de rotação.
2. **`vzdump` do LXC 101**, no Proxmox (Datacenter → Backup), modo snapshot.
   É o que salva se o container for destruído. Agende *depois* da camada 1,
   assim o arquivo sempre contém um banco íntegro mesmo se o snapshot pegar
   o SQLite no meio de uma escrita.
3. **Uma cópia fora desta máquina.** As camadas 1 e 2 morrem junto com o disco.

### Restaurar um backup

```sh
pct exec 101 -- bash -c '
  systemctl stop treino
  cp /var/backups/treino/treino-2026-09-12.db /var/lib/treino/treino.db
  chown treino:treino /var/lib/treino/treino.db
  systemctl start treino
'
```

### Adicionar outra pessoa

```sh
pct exec 101 -- bash -c '
  cd /opt/treino/server
  BANCO=/var/lib/treino/treino.db sudo -u treino -E \
    node scripts/criar-usuario.js "Nome" ficha-fulano-2026-01 https://treinomae.arthuradriano.com
'
```

Cada pessoa recebe o seu link. Os dados já são isolados por `user_id` no banco.
