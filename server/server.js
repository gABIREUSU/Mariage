const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const COLECOES = ['usuarios', 'clientes', 'eventos'];

fs.mkdirSync(DATA_DIR, { recursive: true });
const arquivo = (colecao) => path.join(DATA_DIR, `${colecao}.json`);

function ler(colecao) {
  try { return fs.readFileSync(arquivo(colecao), 'utf-8'); }
  catch { return '[]'; }
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const m = req.url.match(/^\/api\/(\w+)$/);
  if (!m || !COLECOES.includes(m[1])) { res.writeHead(404); return res.end(); }
  const colecao = m[1];

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(ler(colecao));
  }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const dados = JSON.parse(body);
        const tmp = arquivo(colecao) + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(dados, null, 2)); // indentado, legível
        fs.renameSync(tmp, arquivo(colecao));                  // troca o arquivo de uma vez
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  res.writeHead(405);
  res.end();
}).listen(PORT, '0.0.0.0', () => console.log(`API em http://localhost:${PORT}`));