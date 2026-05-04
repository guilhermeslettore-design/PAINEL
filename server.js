const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 8081;
const ROOT = __dirname;

// =====================================================================
//  CONFIGURAÇÃO DA API KEY DA ANTHROPIC
//  Opção 1 (recomendado): variável de ambiente
//    Windows CMD:  set ANTHROPIC_API_KEY=sk-ant-...
//    Windows PS:   $env:ANTHROPIC_API_KEY="sk-ant-..."
//  Opção 2: edite o arquivo config.json nesta pasta
// =====================================================================
let API_KEY = process.env.ANTHROPIC_API_KEY || '';
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  if (!API_KEY && cfg.ANTHROPIC_API_KEY && cfg.ANTHROPIC_API_KEY !== 'SUA_API_KEY_AQUI') {
    API_KEY = cfg.ANTHROPIC_API_KEY;
  }
} catch (e) { /* config.json opcional */ }

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.css':  'text/css',
  '.txt':  'text/plain',
};

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end',  () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────
//  Servidor
// ─────────────────────────────────────────────────────────────────────
http.createServer(async function(req, res) {
  setCORS(res);

  // Pre-flight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── POST /api/chat  ──────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body;
    try { body = await readBody(req); }
    catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON inválido: ' + e.message }));
      return;
    }

    if (!API_KEY) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'API key não configurada. Edite o arquivo config.json e coloque sua chave da Anthropic (https://console.anthropic.com/settings/keys), depois reinicie o servidor.'
      }));
      return;
    }

    const messages = (body.messages || []).map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content)
    }));

    if (!messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Campo "messages" ausente ou vazio.' }));
      return;
    }

    const payload = JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      stream:     true,
      messages
    });

    // Responde como SSE para o browser poder consumir o stream
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });

    const apiOpts = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(payload),
      },
    };

    const apiReq = https.request(apiOpts, apiRes => {
      // Repassa o stream SSE da Anthropic diretamente para o browser
      apiRes.on('data',  chunk => { res.write(chunk); });
      apiRes.on('end',   ()    => { res.end(); });
      apiRes.on('error', err  => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: { message: err.message } })}\n\n`);
        res.end();
      });
    });

    apiReq.on('error', err => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: { message: 'Falha ao conectar com api.anthropic.com: ' + err.message } })}\n\n`);
      res.end();
    });

    apiReq.write(payload);
    apiReq.end();
    return;
  }

  // ── Arquivos estáticos  ──────────────────────────────────────────
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/monitor_rio.html';
  const filePath = path.join(ROOT, urlPath);

  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type':  MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });

}).listen(PORT, '127.0.0.1', function() {
  const keyOk = API_KEY && API_KEY !== 'SUA_API_KEY_AQUI';
  console.log('');
  console.log('  ✅  Servidor GSI rodando!');
  console.log('  🌐  Acesse: http://localhost:' + PORT);
  console.log('');
  console.log('  🤖  Chat Claude: botão no canto inferior direito de qualquer página');
  if (!keyOk) {
    console.log('');
    console.log('  ⚠️  API KEY NÃO CONFIGURADA!');
    console.log('  📝  Edite o arquivo config.json e substitua SUA_API_KEY_AQUI');
    console.log('  🔗  Obtenha sua key em: https://console.anthropic.com/settings/keys');
    console.log('  🔄  Depois reinicie o servidor.');
  } else {
    console.log('  ✅  API Key carregada — chat pronto para uso!');
  }
  console.log('');
  console.log('  Pressione Ctrl+C para parar o servidor.');
  console.log('');
});
