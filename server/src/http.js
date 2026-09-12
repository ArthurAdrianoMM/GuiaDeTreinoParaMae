// Utilitarios de HTTP. Sem framework: sao 4 rotas.
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';

const LIMITE_CORPO = 256 * 1024; // 256 KB: a fila offline mais gorda nao chega perto

export function responderJson(res, status, dados) {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(corpo),
    'cache-control': 'no-store',
  });
  res.end(corpo);
}

export function erro(res, status, mensagem) {
  responderJson(res, status, { erro: mensagem });
}

export function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const partes = [];

    req.on('data', (parte) => {
      tamanho += parte.length;
      if (tamanho > LIMITE_CORPO) {
        reject(Object.assign(new Error('Corpo grande demais'), { status: 413 }));
        req.destroy();
        return;
      }
      partes.push(parte);
    });

    req.on('end', () => {
      if (!partes.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('JSON invalido'), { status: 400 }));
      }
    });

    req.on('error', reject);
  });
}

/** Token via header Authorization: Bearer, ou ?k= na URL (link que ela salva na tela de inicio). */
export function extrairToken(req, url) {
  const cabecalho = req.headers.authorization;
  if (cabecalho?.startsWith('Bearer ')) return cabecalho.slice(7).trim();
  return url.searchParams.get('k') || null;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

/**
 * Servidor de arquivos estaticos - so para rodar sem nginx (dev, ou LXC minimo).
 * Em producao o nginx serve isso e nem chega aqui.
 */
export function servirEstatico(res, raiz, caminhoUrl) {
  // normalize + checagem de prefixo: barra o ../../etc/passwd
  const relativo = normalize(decodeURIComponent(caminhoUrl)).replace(/^(\.\.[/\\])+/, '');
  let arquivo = join(raiz, relativo);

  if (!arquivo.startsWith(raiz + sep) && arquivo !== raiz) {
    return erro(res, 403, 'Acesso negado');
  }

  try {
    if (statSync(arquivo).isDirectory()) arquivo = join(arquivo, 'index.html');
  } catch {
    return erro(res, 404, 'Nao encontrado');
  }

  let tamanho;
  try {
    tamanho = statSync(arquivo).size;
  } catch {
    return erro(res, 404, 'Nao encontrado');
  }

  res.writeHead(200, {
    'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream',
    'content-length': tamanho,
  });
  createReadStream(arquivo).pipe(res);
}
