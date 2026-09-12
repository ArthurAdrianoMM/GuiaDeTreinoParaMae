# Deploy — LXC no Proxmox

Requisito único: **Node.js 22.5 ou superior** (usa o SQLite embutido, `node:sqlite`).
Não existe `npm install` — o backend não tem dependências.

## 1. Criar o container

No Proxmox: template **Debian 12**, não privilegiado.

| Recurso | Valor    |
|---------|----------|
| vCPU    | 1        |
| RAM     | 512 MB   |
| Disco   | 8 GB     |

## 2. Preparar o sistema

```sh
apt update && apt upgrade -y
apt install -y curl nginx ca-certificates

# Node 24 LTS
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node -v        # precisa ser >= 22.5

# Usuário sem shell, só para rodar o serviço
adduser --system --group --no-create-home --home /opt/treino treino
```

## 3. Enviar o código

Do seu computador:

```sh
rsync -av --exclude 'dados/' --exclude '.git/' --exclude 'backups/' \
  ./ root@IP-DO-LXC:/opt/treino/
```

No container:

```sh
mkdir -p /var/lib/treino /var/backups/treino
chown -R treino:treino /opt/treino /var/lib/treino /var/backups/treino
chmod 750 /var/lib/treino
```

## 4. Criar a usuária e pegar o link

```sh
cd /opt/treino/server
BANCO=/var/lib/treino/treino.db sudo -u treino -E \
  node scripts/criar-usuario.js "Mãe" ficha-mae-2026-01 https://treino.SEU-DOMINIO.com
```

Guarde o link impresso — é ele que ela salva na tela de início.
**O link é a senha:** quem tiver o link entra. Mande por WhatsApp direto para ela, não em grupo.

## 5. Subir o serviço

```sh
cp /opt/treino/deploy/treino.service        /etc/systemd/system/
cp /opt/treino/deploy/treino-backup.service /etc/systemd/system/
cp /opt/treino/deploy/treino-backup.timer   /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now treino.service
systemctl enable --now treino-backup.timer

systemctl status treino --no-pager
curl -s localhost:3000/api/saude          # {"ok":true,...}
```

## 6. nginx e HTTPS

```sh
cp /opt/treino/deploy/nginx.conf /etc/nginx/sites-available/treino
# trocar treino.SEU-DOMINIO.com pelo domínio real:
sed -i 's/treino.SEU-DOMINIO.com/treino.exemplo.com/' /etc/nginx/sites-available/treino

ln -sf /etc/nginx/sites-available/treino /etc/nginx/sites-enabled/treino
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Apontar o DNS do subdomínio para o IP, liberar 80 e 443, e então:

```sh
apt install -y certbot python3-certbot-nginx
certbot --nginx -d treino.exemplo.com
```

HTTPS é obrigatório: sem ele o navegador restringe recursos e o link fica exposto na rede.

## 7. Conferir

```sh
curl -s https://treino.exemplo.com/api/saude
curl -s -H "Authorization: Bearer SEU-TOKEN" https://treino.exemplo.com/api/eu
```

Abrir o link com `?k=` no celular → **Compartilhar → Adicionar à Tela de Início**.

---

## Operação

```sh
journalctl -u treino -f                    # logs ao vivo
systemctl restart treino                   # reiniciar
systemctl list-timers treino-backup        # próximo backup
systemctl start treino-backup.service      # backup agora
```

### Atualizar o código

```sh
rsync -av --exclude 'dados/' --exclude '.git/' ./ root@IP:/opt/treino/
ssh root@IP 'chown -R treino:treino /opt/treino && systemctl restart treino'
```

Mudança só em `public/` (ficha, vídeos, CSS) **não precisa de restart** — o nginx serve na hora.

### Trocar a ficha quando o professor passar a nova

1. Criar `public/data/fichas/ficha-mae-2026-03.json`
2. Subir o arquivo (rsync)
3. Apontar a usuária para ela:

```sh
cd /opt/treino/server && sudo -u treino BANCO=/var/lib/treino/treino.db node -e "
import('./src/db.js').then(({abrirBanco}) => {
  const db = abrirBanco(process.env.BANCO);
  db.prepare('UPDATE usuarios SET ficha_ativa = ? WHERE id = ?').run('ficha-mae-2026-03', 1);
  console.log('ficha atualizada');
});"
```

A ficha antiga continua no repositório — o histórico dela permanece interpretável.

### Restaurar um backup

```sh
systemctl stop treino
cp /var/backups/treino/treino-2026-09-12.db /var/lib/treino/treino.db
chown treino:treino /var/lib/treino/treino.db
systemctl start treino
```

Os backups ficam dentro do próprio LXC. **Leve-os para fora** (snapshot do Proxmox em disco separado,
ou um `rsync` para outra máquina) — backup no mesmo disco não protege contra perda do disco.

### Adicionar outra pessoa

```sh
node scripts/criar-usuario.js "Seu nome" ficha-fulano-2026-01 https://treino.exemplo.com
```

Cada pessoa recebe o seu link. Os dados já são isolados por `user_id` no banco.
