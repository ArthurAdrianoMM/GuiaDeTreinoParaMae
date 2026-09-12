# Guia de Treino para Mãe

Site simples para minha mãe acompanhar os exercícios e ver sua execução.

## Rodar localmente

Precisa de um servidor HTTP (`fetch` e módulos ES não funcionam via `file://`):

```sh
cd public && python3 -m http.server 8777
```

Abrir http://localhost:8777

## Estrutura

```
public/
  index.html
  css/style.css
  js/app.js        renderização e interação
  js/storage.js    persistência (hoje localStorage, amanhã API)
  data/
    exercicios.json          catálogo reutilizável (instruções, vídeo, músculos)
    fichas/*.json            prescrição: séries, reps, descanso
```

Conteúdo (exercícios e fichas) é versionado em JSON, sem banco.
O banco/API entra só para o registro do que ela fez.

## Pendências

- [ ] Preencher `video` de cada exercício em `data/exercicios.json` com o ID do YouTube
      (o trecho depois de `v=` na URL). Assistir antes de colar.
- [ ] Confirmar séries/reps com o professor (ver `_pendente` na ficha)
- [ ] Backend + SQLite substituindo o localStorage
