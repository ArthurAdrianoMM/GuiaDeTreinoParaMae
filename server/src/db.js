// Banco: SQLite embutido do Node (node:sqlite). Sem dependencia externa.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id           INTEGER PRIMARY KEY,
  nome         TEXT    NOT NULL,
  token        TEXT    NOT NULL UNIQUE,
  ficha_ativa  TEXT    NOT NULL,
  criado_em    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Uma sessao = um dia de treino de uma pessoa.
-- Criada sob demanda, na primeira serie registrada: e' isso que torna a presenca automatica.
CREATE TABLE IF NOT EXISTS sessoes (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES usuarios(id),
  data        TEXT    NOT NULL,              -- AAAA-MM-DD
  treino_id   TEXT    NOT NULL,              -- 'A' | 'B'
  ficha_id    TEXT    NOT NULL,              -- congela qual ficha valia nesse dia
  observacao  TEXT,
  criado_em   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, data, treino_id)
);

CREATE TABLE IF NOT EXISTS series (
  id            INTEGER PRIMARY KEY,
  sessao_id     INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  exercicio_id  TEXT    NOT NULL,
  indice        INTEGER NOT NULL,            -- 0-based
  feito         INTEGER NOT NULL DEFAULT 0,
  carga         TEXT,
  reps          TEXT,
  atualizado_em INTEGER NOT NULL,            -- epoch ms, vindo do cliente: resolve conflito de sync
  UNIQUE (sessao_id, exercicio_id, indice)
);

CREATE INDEX IF NOT EXISTS idx_sessoes_user_data ON sessoes (user_id, data DESC);
`;

let db;

export function abrirBanco(caminho) {
  mkdirSync(dirname(caminho), { recursive: true });
  db = new DatabaseSync(caminho);
  db.exec('PRAGMA journal_mode = WAL');   // aguenta leitura durante escrita
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(SCHEMA);
  return db;
}

export function fecharBanco() {
  db?.close();
  db = undefined;
}

// ---------- Usuarios ----------

export function usuarioPorToken(token) {
  if (!token) return null;
  return db.prepare('SELECT id, nome, ficha_ativa FROM usuarios WHERE token = ?').get(token) ?? null;
}

export function criarUsuario({ nome, token, fichaAtiva }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuarios (nome, token, ficha_ativa) VALUES (?, ?, ?)')
    .run(nome, token, fichaAtiva);
  return Number(lastInsertRowid);
}

export function listarUsuarios() {
  return db.prepare('SELECT id, nome, ficha_ativa, criado_em FROM usuarios ORDER BY id').all();
}

// ---------- Sessoes e series ----------

function garantirSessao({ userId, data, treinoId, fichaId }) {
  const existente = db
    .prepare('SELECT id FROM sessoes WHERE user_id = ? AND data = ? AND treino_id = ?')
    .get(userId, data, treinoId);
  if (existente) return existente.id;

  const { lastInsertRowid } = db
    .prepare('INSERT INTO sessoes (user_id, data, treino_id, ficha_id) VALUES (?, ?, ?, ?)')
    .run(userId, data, treinoId, fichaId);
  return Number(lastInsertRowid);
}

/**
 * Grava varias series de uma vez (o cliente manda a fila acumulada offline).
 * Last-write-wins por serie, decidido pelo carimbo `atualizadoEm` do cliente:
 * uma gravacao antiga chegando atrasada nao sobrescreve uma mais nova.
 */
export function salvarSeries(userId, registros) {
  const inserir = db.prepare(`
    INSERT INTO series (sessao_id, exercicio_id, indice, feito, carga, reps, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (sessao_id, exercicio_id, indice) DO UPDATE SET
      feito         = excluded.feito,
      carga         = excluded.carga,
      reps          = excluded.reps,
      atualizado_em = excluded.atualizado_em
    WHERE excluded.atualizado_em >= series.atualizado_em
  `);

  db.exec('BEGIN');
  try {
    for (const r of registros) {
      const sessaoId = garantirSessao({
        userId,
        data: r.data,
        treinoId: r.treinoId,
        fichaId: r.fichaId,
      });
      inserir.run(
        sessaoId,
        r.exercicioId,
        r.indice,
        r.feito ? 1 : 0,
        r.carga ?? null,
        r.reps ?? null,
        r.atualizadoEm,
      );
    }
    db.exec('COMMIT');
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
  return registros.length;
}

/** Sessoes do usuario no formato que o frontend consome: { "data|treino": {...} } */
export function listarSessoes(userId, desde) {
  const sessoes = desde
    ? db.prepare('SELECT * FROM sessoes WHERE user_id = ? AND data >= ? ORDER BY data DESC').all(userId, desde)
    : db.prepare('SELECT * FROM sessoes WHERE user_id = ? ORDER BY data DESC').all(userId);

  const buscarSeries = db.prepare(
    'SELECT exercicio_id, indice, feito, carga, reps, atualizado_em FROM series WHERE sessao_id = ? ORDER BY indice',
  );

  const saida = {};
  for (const sessao of sessoes) {
    const exercicios = {};
    for (const s of buscarSeries.all(sessao.id)) {
      const alvo = (exercicios[s.exercicio_id] ??= { series: [] });
      alvo.series[s.indice] = {
        feito: Boolean(s.feito),
        carga: s.carga ?? '',
        reps: s.reps ?? '',
        atualizadoEm: s.atualizado_em,
      };
    }
    saida[`${sessao.data}|${sessao.treino_id}`] = { fichaId: sessao.ficha_id, exercicios };
  }
  return saida;
}
