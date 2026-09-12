# Guia de Treino para Mãe

Site para minha mãe acompanhar os treinos, ver a execução de cada exercício em vídeo
e registrar o que fez (carga, repetições, presença).

## Rodar localmente

```sh
node server/scripts/criar-usuario.js "Mãe" ficha-mae-2026-01 http://localhost:3000
node server/src/server.js
```

Abrir o link com `?k=...` que o primeiro comando imprimiu.
Precisa de **Node 22.5+** (usa o SQLite embutido). Sem `npm install`.

```sh
cd server && npm test    # 22 testes da API
```

## Estrutura

```
public/                          frontend estático
  index.html
  css/style.css
  js/app.js                      renderização e interação
  js/storage.js                  persistência local-first + sync
  js/regua.js                    seletor de carga/reps por arrasto horizontal
  js/tato.js                     retorno tátil (vibração) da régua
  js/icones.js                   ícones SVG autorais (sem emoji na interface)
  data/
    exercicios.json              catálogo: instruções, vídeo, músculos, segurança
    fichas/*.json                prescrição: séries, reps, descanso

server/
  src/server.js                  4 rotas em node:http
  src/db.js                      SQLite (node:sqlite) + schema
  src/validacao.js               validação de tudo que vem do cliente
  src/http.js                    helpers (JSON, estáticos, token)
  scripts/criar-usuario.js       cria usuário e imprime o link de acesso
  scripts/backup.js              backup consistente + rotação
  test/api.test.js

deploy/                          nginx, systemd, cloudflared, backup, DEPLOY.md
```

## Como funciona

**Conteúdo** (exercícios, fichas) é JSON versionado no git — sem banco, sem tela de admin.
Editar num editor de texto e subir o arquivo.

**Registro** (o que ela fez) vai para SQLite. A sessão do dia é criada sozinha
na primeira série marcada: não existe botão "iniciar treino".

**Local-first:** toda gravação vai primeiro para o aparelho e entra numa fila
enviada ao servidor quando há rede. Na academia o wifi cai, e o app não pode travar por isso.
Conflitos são resolvidos por carimbo de tempo, com a mesma regra nos dois lados.

**Registrar sem teclado:** carga e repetições não são campos de digitação. Cada valor é
um botão que abre uma régua horizontal: ela arrasta o dedo e o valor encaixa em cada
traço, com uma vibração curta a cada traço cruzado (Android; o Safari do iPhone não
expõe a Vibration API e a régua funciona igual, só sem o toque). A régua abre já
centrada no valor mais provável — o desta série, senão o da série anterior, senão a
carga da última vez, senão o alvo prescrito — então repetir a carga custa zero
movimento. Marcar a série como feita grava o que está na tela: uma série inteira é um
toque só. A régua também responde a setas, Home/End e PageUp/PageDown, e se anuncia
como `role="slider"`.

**Acesso:** cada pessoa tem um link com token (`/?k=...`) que salva na tela de início.
Sem tela de login. O link é a senha.

## API

| Método | Rota            | O que faz                                   |
|--------|-----------------|---------------------------------------------|
| GET    | `/api/saude`    | healthcheck (sem token)                     |
| GET    | `/api/eu`       | nome e ficha ativa do usuário               |
| GET    | `/api/sessoes`  | histórico (`?desde=AAAA-MM-DD` filtra)      |
| POST   | `/api/series`   | grava séries em lote (a fila offline)       |

Token em `Authorization: Bearer <token>` ou `?k=<token>`.

## Deploy

Ver [deploy/DEPLOY.md](deploy/DEPLOY.md) — LXC Debian no Proxmox, nginx, systemd e Cloudflare Tunnel.

## Pendências

- [ ] **Preencher `video` dos 12 exercícios** em `public/data/exercicios.json` com o ID
      do YouTube (o trecho depois de `v=`). Assistir cada um antes de colar.
- [ ] Mostrar a ficha ao professor na próxima avaliação. Séries, repetições, descanso
      e aquecimento seguem a pesquisa em `docs/Treino Feminino Baseado Em Evidências.md`;
      se ele ajustar algo, o ajuste entra na ficha.
