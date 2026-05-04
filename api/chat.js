/**
 * api/chat.js — Vercel Serverless Function
 * Substitui o endpoint POST /api/chat do server.js Express.
 * A API key é lida de process.env.ANTHROPIC_API_KEY (variável de ambiente do Vercel).
 */

'use strict';

const https = require('https');

module.exports = async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  // ── API Key ───────────────────────────────────────────────────────────
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    res.status(500).json({
      error:
        'ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente no painel do Vercel: ' +
        'Project Settings → Environment Variables.',
    });
    return;
  }

  // ── Body ──────────────────────────────────────────────────────────────
  // O Vercel já faz o parse do JSON automaticamente via req.body,
  // mas se vier como string (raw), fazemos o parse manualmente.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      res.status(400).json({ error: 'JSON inválido: ' + e.message });
      return;
    }
  }

  const rawMessages = body && body.messages;
  if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
    res.status(400).json({ error: 'Campo "messages" ausente ou vazio.' });
    return;
  }

  const messages = rawMessages.map(m => ({
    role:    m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content),
  }));

  // ── Payload para a Anthropic ──────────────────────────────────────────
  const payload = JSON.stringify({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    stream:     true,
    messages,
  });

  // ── Cabeçalhos SSE ────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  // Necessário para o Vercel não bufferizar a resposta
  res.setHeader('X-Accel-Buffering', 'no');

  // ── Chamada à Anthropic API ───────────────────────────────────────────
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

  return new Promise((resolve) => {
    const apiReq = https.request(apiOpts, (apiRes) => {
      // Repassa o stream SSE da Anthropic diretamente para o browser
      apiRes.on('data',  chunk => { res.write(chunk); });
      apiRes.on('end',   ()    => { res.end(); resolve(); });
      apiRes.on('error', err  => {
        try {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: { message: err.message } })}\n\n`
          );
          res.end();
        } catch (_) {}
        resolve();
      });
    });

    apiReq.on('error', err => {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: { message: 'Falha ao conectar com api.anthropic.com: ' + err.message },
          })}\n\n`
        );
        res.end();
      } catch (_) {}
      resolve();
    });

    apiReq.write(payload);
    apiReq.end();
  });
};
