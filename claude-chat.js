/**
 * claude-chat.js
 * Widget de chat flutuante integrado à API da Anthropic (claude-sonnet-4-6).
 * Inclua este arquivo em qualquer página HTML servida pelo server.js:
 *   <script src="/claude-chat.js"></script>
 */
(function () {
  'use strict';
  if (document.getElementById('_cc-widget')) return; // evita dupla injeção

  // ─── Estilos ──────────────────────────────────────────────────────
  const CSS = `
#_cc-btn {
  position:fixed; bottom:24px; right:24px; width:56px; height:56px;
  border-radius:50%; background:linear-gradient(135deg,#E8B94F,#F97316);
  border:none; cursor:pointer; font-size:24px;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 20px rgba(232,185,79,.45); z-index:9999;
  transition:transform .2s,box-shadow .2s;
}
#_cc-btn:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(232,185,79,.65); }

#_cc-panel {
  position:fixed; bottom:90px; right:24px; width:390px; max-height:570px;
  background:#161B27; border:1px solid #2A3A55; border-radius:16px;
  display:flex; flex-direction:column;
  box-shadow:0 8px 40px rgba(0,0,0,.65); z-index:9998; overflow:hidden;
  transition:opacity .2s,transform .2s;
}
#_cc-panel.cc-hidden { opacity:0; pointer-events:none; transform:translateY(14px); }

@media(max-width:440px){
  #_cc-panel { right:8px; left:8px; width:auto; bottom:80px; }
  #_cc-btn   { bottom:16px; right:16px; }
}

._cc-hdr {
  background:linear-gradient(135deg,#0D1117,#1C2333);
  border-bottom:1px solid #2A3A55;
  padding:13px 16px; display:flex; align-items:center; gap:10px; flex-shrink:0;
}
._cc-hdr-ico { font-size:20px; }
._cc-hdr-title { font-weight:700; color:#E2E8F0; font-size:14px;
  font-family:'Segoe UI',system-ui,sans-serif; }
._cc-hdr-sub { font-size:11px; color:#8B9DC3;
  font-family:'Segoe UI',system-ui,sans-serif; }
._cc-close {
  margin-left:auto; background:none; border:none; color:#4A5A7A;
  cursor:pointer; font-size:18px; line-height:1; transition:color .15s;
}
._cc-close:hover { color:#E2E8F0; }

._cc-msgs {
  flex:1; overflow-y:auto; padding:14px;
  display:flex; flex-direction:column; gap:12px;
  scrollbar-width:thin; scrollbar-color:#2A3A55 transparent;
}
._cc-msgs::-webkit-scrollbar { width:5px; }
._cc-msgs::-webkit-scrollbar-thumb { background:#2A3A55; border-radius:4px; }

._cc-welcome {
  text-align:center; padding:22px 12px; color:#4A5A7A; font-size:12.5px;
  line-height:1.65; font-family:'Segoe UI',system-ui,sans-serif;
}
._cc-welcome strong { color:#8B9DC3; display:block; margin-bottom:7px; font-size:13.5px; }

._cc-msg { max-width:86%; display:flex; flex-direction:column; gap:3px; }
._cc-msg.user      { align-self:flex-end; }
._cc-msg.assistant { align-self:flex-start; }

._cc-bubble {
  padding:10px 13px; border-radius:12px; font-size:13px; line-height:1.6;
  white-space:pre-wrap; word-break:break-word;
  font-family:'Segoe UI',system-ui,sans-serif;
}
._cc-msg.user      ._cc-bubble {
  background:linear-gradient(135deg,rgba(232,185,79,.18),rgba(249,115,22,.14));
  border:1px solid rgba(232,185,79,.35); color:#E2E8F0;
}
._cc-msg.assistant ._cc-bubble {
  background:#1C2333; border:1px solid #2A3A55; color:#CBD5E1;
}
._cc-time {
  font-size:10px; color:#4A5A7A;
  font-family:'Segoe UI',system-ui,sans-serif;
}
._cc-msg.user ._cc-time { align-self:flex-end; }

._cc-typing { align-self:flex-start; }
._cc-typing ._cc-bubble {
  display:flex; gap:5px; align-items:center; padding:10px 16px;
}
._cc-dot {
  width:7px; height:7px; border-radius:50%; background:#E8B94F;
  animation:_cc-blink .9s infinite;
}
._cc-dot:nth-child(2){ animation-delay:.18s; }
._cc-dot:nth-child(3){ animation-delay:.36s; }
@keyframes _cc-blink {
  0%,80%,100%{ opacity:.2; transform:scale(.8); }
  40%         { opacity:1;  transform:scale(1);  }
}

._cc-err {
  background:rgba(240,92,92,.12); border:1px solid rgba(240,92,92,.3);
  color:#F87171; font-size:12px; border-radius:8px; padding:9px 13px;
  font-family:'Segoe UI',system-ui,sans-serif; line-height:1.5;
}

._cc-footer {
  border-top:1px solid #2A3A55; padding:10px 12px;
  display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
}
._cc-input {
  flex:1; background:#0D1117; border:1px solid #2A3A55; border-radius:10px;
  color:#E2E8F0; font-size:13px; padding:9px 12px;
  resize:none; min-height:38px; max-height:130px; outline:none;
  transition:border-color .2s; font-family:'Segoe UI',system-ui,sans-serif;
  line-height:1.45;
}
._cc-input:focus  { border-color:rgba(232,185,79,.45); }
._cc-input::placeholder { color:#4A5A7A; }
._cc-send {
  width:38px; height:38px; flex-shrink:0; border-radius:10px;
  background:linear-gradient(135deg,#E8B94F,#F97316);
  border:none; cursor:pointer; font-size:16px;
  display:flex; align-items:center; justify-content:center;
  transition:opacity .2s,transform .15s;
}
._cc-send:hover    { opacity:.85; transform:scale(1.06); }
._cc-send:disabled { opacity:.35; cursor:not-allowed; transform:none; }

._cc-clear-btn {
  background:none; border:none; color:#4A5A7A; font-size:11px;
  cursor:pointer; padding:2px 6px; border-radius:4px; transition:color .15s;
  font-family:'Segoe UI',system-ui,sans-serif;
}
._cc-clear-btn:hover { color:#8B9DC3; }
`;

  // ─── HTML ─────────────────────────────────────────────────────────
  const HTML = `
<style>${CSS}</style>
<button id="_cc-btn" title="Conversar com a Rafinha" aria-label="Abrir Rafinha">🛡</button>
<div id="_cc-panel" class="cc-hidden" role="dialog" aria-label="Rafinha — IA do GSI">
  <div class="_cc-hdr">
    <span class="_cc-hdr-ico">🛡</span>
    <div>
      <div class="_cc-hdr-title">Rafinha</div>
      <div class="_cc-hdr-sub">IA do GSI · Online</div>
    </div>
    <button class="_cc-close" id="_cc-close" aria-label="Fechar">✕</button>
  </div>
  <div class="_cc-msgs" id="_cc-msgs">
    <div class="_cc-welcome">
      <strong>👋 E aí! Sou a Rafinha</strong>
      IA do GSI. Posso responder dúvidas sobre o painel, resumir o que tá no feed,
      buscar posts antigos — ou qualquer pergunta sua. Bora trabalhar!
    </div>
  </div>
  <div class="_cc-footer">
    <textarea class="_cc-input" id="_cc-input"
      placeholder="Digite sua mensagem… (Enter envia, Shift+Enter quebra linha)"
      rows="1" aria-label="Mensagem"></textarea>
    <button class="_cc-send" id="_cc-send" aria-label="Enviar">➤</button>
  </div>
</div>
`;

  // ─── Injeção ──────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = '_cc-widget';
  host.innerHTML = HTML;
  document.body.appendChild(host);

  // ─── Referências ──────────────────────────────────────────────────
  const btn    = document.getElementById('_cc-btn');
  const panel  = document.getElementById('_cc-panel');
  const close  = document.getElementById('_cc-close');
  const msgs   = document.getElementById('_cc-msgs');
  const input  = document.getElementById('_cc-input');
  const sendB  = document.getElementById('_cc-send');

  // ─── Estado ───────────────────────────────────────────────────────
  const history = []; // [{role, content}]
  let busy = false;

  // ─── Toggle painel ────────────────────────────────────────────────
  btn.addEventListener('click',  () => panel.classList.toggle('cc-hidden'));
  close.addEventListener('click',() => panel.classList.add('cc-hidden'));

  // Fechar clicando fora
  document.addEventListener('click', e => {
    if (!panel.classList.contains('cc-hidden') &&
        !panel.contains(e.target) && e.target !== btn) {
      panel.classList.add('cc-hidden');
    }
  });

  // ─── Auto-resize textarea ─────────────────────────────────────────
  input.addEventListener('input', autoResize);
  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  }

  // ─── Atalhos de teclado ───────────────────────────────────────────
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendB.addEventListener('click', send);

  // ─── Helpers de UI ────────────────────────────────────────────────
  function timestamp() {
    return new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  }

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function addBubble(role, text) {
    const wrap = document.createElement('div');
    wrap.className = '_cc-msg ' + role;
    const bubble = document.createElement('div');
    bubble.className = '_cc-bubble';
    bubble.textContent = text;
    const time = document.createElement('span');
    time.className = '_cc-time';
    time.textContent = timestamp();
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    msgs.appendChild(wrap);
    scrollBottom();
    return bubble;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = '_cc-msg assistant _cc-typing';
    wrap.id = '_cc-typing';
    wrap.innerHTML = '<div class="_cc-bubble"><div class="_cc-dot"></div><div class="_cc-dot"></div><div class="_cc-dot"></div></div>';
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function removeTyping() {
    const el = document.getElementById('_cc-typing');
    if (el) el.remove();
  }

  function addError(text) {
    const div = document.createElement('div');
    div.className = '_cc-err';
    div.textContent = '⚠️ ' + text;
    msgs.appendChild(div);
    scrollBottom();
  }

  // ─── Envio de mensagem ────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    sendB.disabled = true;
    input.value = '';
    autoResize();

    addBubble('user', text);
    history.push({ role: 'user', content: text });

    addTyping();

    let fullText = '';

    try {
      const resp = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });

      removeTyping();

      if (!resp.ok) {
        let msg = 'Erro ' + resp.status;
        try { const j = await resp.json(); msg = j.error || msg; } catch(_) {}
        addError(msg);
        history.pop(); // remove a msg do usuário que falhou
        busy = false; sendB.disabled = false; input.focus();
        return;
      }

      // ── Stream SSE ────────────────────────────────────────────────
      const bubble = (() => {
        const wrap = document.createElement('div');
        wrap.className = '_cc-msg assistant';
        const b = document.createElement('div');
        b.className = '_cc-bubble';
        const t = document.createElement('span');
        t.className = '_cc-time';
        t.textContent = timestamp();
        wrap.appendChild(b);
        wrap.appendChild(t);
        msgs.appendChild(wrap);
        scrollBottom();
        return b;
      })();

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // guarda linha incompleta

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]' || !raw) continue;

          let evt;
          try { evt = JSON.parse(raw); } catch(_) { continue; }

          if (evt.type === 'content_block_delta' && evt.delta?.text) {
            fullText += evt.delta.text;
            bubble.textContent = fullText;
            scrollBottom();
          } else if (evt.type === 'error') {
            const errMsg = evt.error?.message || JSON.stringify(evt.error);
            bubble.textContent = '⚠️ Erro da API: ' + errMsg;
            fullText = '';
          }
        }
      }

      if (fullText) {
        history.push({ role: 'assistant', content: fullText });
      }

    } catch (err) {
      removeTyping();
      addError('Falha de conexão: ' + err.message);
      history.pop();
    }

    busy = false;
    sendB.disabled = false;
    input.focus();
  }

})();
