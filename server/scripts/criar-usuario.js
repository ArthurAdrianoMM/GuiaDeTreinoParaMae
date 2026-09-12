#!/usr/bin/env node
// Cria um usuario e imprime o link que ela salva na tela de inicio.
//   node server/scripts/criar-usuario.js "Mãe" ficha-mae-2026-01 https://treino.seudominio.com
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirBanco, criarUsuario, listarUsuarios } from '../src/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const [nome, fichaAtiva, base] = process.argv.slice(2);

if (!nome || !fichaAtiva) {
  console.error('Uso: node criar-usuario.js "<nome>" <ficha-ativa> [url-base]');
  console.error('Ex.:  node criar-usuario.js "Mãe" ficha-mae-2026-01 https://treino.exemplo.com');
  process.exit(1);
}

abrirBanco(process.env.BANCO ?? resolve(AQUI, '../../dados/treino.db'));

const token = randomBytes(16).toString('base64url'); // 128 bits
const id = criarUsuario({ nome, token, fichaAtiva });

console.log(`\nUsuário criado: #${id} — ${nome}`);
console.log(`Token: ${token}`);
console.log(`\nLink para ela salvar na tela de início:`);
console.log(`  ${(base ?? 'https://SEU-DOMINIO').replace(/\/$/, '')}/?k=${token}\n`);
console.log('Usuários no banco:');
console.table(listarUsuarios());
