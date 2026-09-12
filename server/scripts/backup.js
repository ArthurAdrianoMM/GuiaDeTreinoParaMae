#!/usr/bin/env node
// Backup consistente do SQLite. VACUUM INTO gera um arquivo integro mesmo
// com o servidor escrevendo no meio - um `cp` nao garante isso.
//   node backup.js [destino] [quantos_manter]
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const banco = process.env.BANCO ?? resolve(AQUI, '../../dados/treino.db');
const destino = resolve(process.argv[2] ?? process.env.BACKUP_DIR ?? resolve(AQUI, '../../backups'));
const manter = Number(process.argv[3] ?? 30);

mkdirSync(destino, { recursive: true });

const carimbo = new Date().toISOString().slice(0, 10);
const arquivo = join(destino, `treino-${carimbo}.db`);

const db = new DatabaseSync(banco, { readOnly: true });
db.exec(`VACUUM INTO '${arquivo.replace(/'/g, "''")}'`);
db.close();

console.log(`Backup: ${arquivo} (${(statSync(arquivo).size / 1024).toFixed(1)} KB)`);

// Rotaciona: mantem os N mais recentes
const antigos = readdirSync(destino)
  .filter((f) => /^treino-\d{4}-\d{2}-\d{2}\.db$/.test(f))
  .sort()
  .slice(0, -manter);

for (const f of antigos) {
  unlinkSync(join(destino, f));
  console.log(`Removido backup antigo: ${f}`);
}
