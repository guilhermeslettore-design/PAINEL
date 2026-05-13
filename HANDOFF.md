# 🤝 HANDOFF — Continuar de onde paramos

> **Nomes oficiais do projeto:**
> - **RAFA-RJ** = nome do sistema (a rede social do SSIE-RJ)
> - **Argus** = nome da IA assistente dentro do RAFA-RJ

> **Como usar este arquivo:** quando você abrir uma nova sessão no Claude Code,
> a primeira coisa a fazer é pedir pra ele ler ESTE arquivo + o `VISAO.md`.
> Ele vai entender tudo que já foi feito, o que está pendente e o que decidir.
>
> **Frase mágica pra colar:** está logo abaixo, na seção "👇 Como começar".

---

## 👇 Como começar (cole isto no Claude Code amanhã)

```
Lê o HANDOFF.md e o VISAO.md desse projeto. Eles têm tudo o que precisamos
continuar. Depois de ler, me responde:
1) Qual o estado atual do código?
2) Qual o próximo passo combinado?
3) Tem alguma decisão pendente que precisa de mim?
```

---

## 📌 Onde estamos agora (estado atual)

**Repositório:** `guilhermeslettore-design/painel`
**Branch ativo:** `claude/whatsapp-website-integration-N8knV`
**Último commit:** `e260d09` (remoção de menções a GSI + Argus masculino)
**Deploy em produção:** `https://radar-gsi.vercel.app` (ainda na `main` antiga — branch não mergeado)

### Commits relevantes desta linha de trabalho (mais recente → mais antigo)
- `e260d09` — remove menções a GSI no texto visível + Argus vira masculino
- `9f348c1` — renomeia Rafinha → Argus em todo o sistema
- `1c7dc32` — IA centralizada do GSI com classificação automática (era Rafinha, agora Argus)
- `8d04186` — feed estilo rede social interna na aba Redes Sociais
- `8a9acf0` — cria VISAO.md (visão do produto)

---

## ✅ O que JÁ está pronto

1. **Aba "Redes Sociais" reescrita** como feed colaborativo estilo Twitter+Instagram+WhatsApp:
   - Cards grandes (thumb 140px, texto 14px sem corte)
   - Avatar colorido com inicial
   - Threads de comentários originais aninhadas
   - Toggle "comentários sempre visíveis vs expandir ao clicar"
   - Ações: ❤️ curtir, 💬 comentar, ⭐ marcar relevante, ✏️ editar GSI, 📄 mandar pro relatório
   - Filtros: papel (Caçador/Documentador/Analista/Relator) + status + busca
   - Trending sidebar: assuntos, pessoas, atividade da equipe
   - Modal de perfil clicável (stats + paleta de 20 cores + upload de foto)
   - Lightbox de imagem

2. **Argus — IA central do sistema** (chamada de "o Argus", masculino):
   - Caixa unificada estilo Twitter Compose no topo da aba Redes Sociais
   - Recebe texto + imagem + link num campo só
   - Classifica automaticamente em 5 ações: postar, criar_manifestacao, buscar, responder, processar_grok
   - Detecta convocação de protesto → posta no feed E adiciona em Manifestações automaticamente
   - Drag-drop direto, paste de imagem (Ctrl+V), Ctrl+Enter envia
   - Chat lateral PRIVADO (modal): histórico por pessoa em `localStorage.gsi_argus_chat_<userId>`
   - Botão "📤 Compartilhar com a equipe" joga histórico no feed
   - Widget global (canto inferior direito) renomeado pra Argus

3. **Persistência local** (compartilhamento entre PCs ainda NÃO funciona):
   - Posts da rede social → `localStorage.gsi_b2_posts`
   - Perfil do usuário → `localStorage.gsi_user_profile`
   - Chat do Argus → `localStorage.gsi_argus_chat_<userId>`
   - Demais (Manifestações, Sobrestado, Histórico, etc.) — preservados como já era

4. **Dedup por URL** funciona em todos os caminhos de ingestão.

5. **Remoção de "GSI"** visível: badges viraram "SSIE", "GSI · Estado..." virou "Estado...", logo virou 🛡, etc.
   - Mantido: URL real `cronos.gsi.rj.gov.br`, storage keys `gsi_*` (pra não perder dados), classes CSS internas (`.gsi-bar`).

---

## 🟡 O que NÃO está pronto (próxima sessão)

Foi a parte que **dependia do servidor** — combinado de ser feita quando o
Guilherme estivesse no PC do trabalho (mais potente, sempre ligado).

### Sprint do servidor (próxima sessão)

1. **Modificar `server.js`** pra escutar em `0.0.0.0` (não só `127.0.0.1`)
   - Linha final do `server.js`: `}).listen(PORT, '0.0.0.0', function() {`
   - Adicionar log com IP da rede pro André conectar

2. **Liberar porta 8081 no firewall do Windows**
   - Painel de Controle → Firewall → Nova regra de entrada → TCP porta 8081 → permitir

3. **Adicionar SQLite no `server.js`**:
   - Dependência: `npm install better-sqlite3`
   - Tabelas: `users`, `posts`, `likes`, `comments`, `manifestacoes`, `sessions`
   - Cada tabela com `criado_em`, `autor_id`, `visibilidade`

4. **Endpoints REST mínimos**:
   - `POST /api/login` — autentica e cria sessão (cookie)
   - `POST /api/logout`
   - `GET  /api/posts` — lista feed (respeitando visibilidade do usuário)
   - `POST /api/posts` — cria post (com dedup server-side por URL)
   - `POST /api/posts/:id/like`
   - `POST /api/posts/:id/comment`
   - `GET  /api/manifestacoes`
   - `POST /api/manifestacoes`
   - `GET  /api/users` — lista usuários (pra escolher visibilidade)
   - `GET  /api/chat/anthropic` — proxy pra IA Anthropic com a chave centralizada (tira do localStorage de cada um)

5. **Migrar frontend** do `localStorage` pra fetch dos endpoints
   - Manter fallback offline se servidor cair
   - Polling a cada 10s na aba Redes Sociais pra atualização em tempo real

6. **Login real** (recuperar a tela que já existe mas tá desativada)
   - Linha 3842-3850 do `monitor_rio.html`: remover o auto-login
   - Validar senha no backend, criar sessão, cookie httpOnly

7. **Migração de dados do localStorage** pro banco
   - Script que lê o que tem no `localStorage` do navegador e POSTa no servidor
   - Roda 1x na primeira conexão pra não perder o que o Guilherme já coletou hoje

8. **Status dos cards** (rascunho → em-documentação → completo)
   - Botão "🙋 Eu cuido" trava o card pro usuário atual
   - Outros veem "em documentação por X" e não duplicam

---

## 🎯 Decisões já tomadas (NÃO revisitar)

- ✅ **Modelo de produto:** rede social interna do GSI/SSIE-RJ, 5-20 pessoas, fechada
- ✅ **Linha de produção:** Caçador → Documentador → Analista → Relator
- ✅ **Storage:** compartilhado (SQLite no servidor), exceto dark mode e login (locais)
- ✅ **Hospedagem:** PC do trabalho do Guilherme rodando `server.js` em modo servidor (`0.0.0.0`)
- ✅ **Identidade da IA:** **Argus**, masculino ("o Argus"), persona profissional+amigável+brasileiro
- ✅ **Visual:** híbrido X (estrutura) + Instagram (print grande) + WhatsApp (link preview)
- ✅ **Chat com IA:** privado por pessoa, com botão "compartilhar conversa" opcional
- ✅ **Comentários originais aninhados:** toggle "sempre visível vs expandir ao clicar"
- ✅ **Avatar:** paleta de 20 cores escolhível, ou cor automática estável por nome, ou foto opcional, ou bonequinho fallback
- ✅ **Dedup por URL:** "Já coletado por X há Y" trava nova inserção
- ✅ **Visibilidade por post:** Público / Só eu / Selecionados / Todos menos selecionados
- ✅ **Integração entre abas:** convocação detectada vai pro feed E pra Manifestações + Sobrestado automaticamente
- ✅ **Nomenclatura:** mantidos termos técnicos ("Sobrestado", "RELINT", "B1/B2/B3") — não renomeei
- ✅ **Página inicial:** não tocar agora — foco total em Redes Sociais
- ✅ **Segurança (senhas hardcoded, login bypass, API key no browser):** corrigir junto com a migração pro servidor

---

## ⚠️ Limitações conhecidas hoje (esperadas, vão sumir com o servidor)

- Tudo no `localStorage` — Guilherme no PC de casa não vê o que André postar do PC dele
- Todos os posts aparecem como "Guilherme" (única conta enquanto não tem login real)
- "Caixa URL" só salva o link em fila — não tira print automático (precisa Puppeteer no servidor)
- Comentários internos da equipe viram texto agregado no Comentário GSI (sem servidor não tem thread)
- `radar-gsi.vercel.app` ainda mostra versão antiga (branch não mergeado)

---

## 🧪 Como testar agora (sem servidor ainda)

1. Abre `monitor_rio.html` direto no navegador OU roda `INICIAR_SERVIDOR.bat`
2. Configura a chave da Anthropic (aba Manifestações → cole sk-ant-...)
3. Vai na aba **💬 Redes Sociais**
4. Testa a Caixa do Argus:
   - Arrasta um print de post
   - Cola uma URL
   - Cola texto do Grok
   - Faz uma pergunta livre
5. Confirma que aba **📋 Manifestações** continua funcionando (sem regressão)
6. Confirma que **Relatório** exporta `.doc` corretamente

---

## 📚 Arquivos importantes do projeto

| Arquivo | O que tem |
|---|---|
| `monitor_rio.html` | Tudo — HTML, CSS, JS principal (~7100 linhas) |
| `server.js` | Servidor Node local (porta 8081) — vai evoluir pra ter SQLite + endpoints |
| `api/chat.js` | Versão Vercel serverless do server.js |
| `claude-chat.js` | Widget de chat global (canto inferior direito) — já é o Argus |
| `VISAO.md` | Visão do produto (rede social interna do GSI) |
| `HANDOFF.md` | Este arquivo — atualizar a cada sessão |
| `config.json.exemplo` | Template da chave Anthropic |

---

## 🚀 Próximo passo imediato (quando ligar PC do trabalho)

1. **Confirma com o Claude Code que ele leu este HANDOFF.md e o VISAO.md.**
2. **Diz que você tá no PC do trabalho** (poderoso, sempre ligado, na rede do GSI).
3. **Pergunta:** "Bora começar o sprint do servidor? Começa pelo passo 1 (server.js em 0.0.0.0) + passo 3 (SQLite)."
4. **Decide qual chave da Anthropic usar** — recomendação: criar uma chave nova dedicada pro servidor (env var no `config.json`), pra ela ser compartilhada pelo setor inteiro.

---

## 📝 Histórico desta linha de trabalho

Esta sessão (13/05/2026) entregou:
- Visão do produto cristalizada (`VISAO.md`)
- Aba Redes Sociais reescrita do zero como feed colaborativo
- Argus criado como IA central com classificação automática + chat privado
- Limpeza de menções a "GSI" no texto visível
- 5 screenshots demonstrando o estado final entregues na conversa

**Atualizar este arquivo a cada sessão.** Quando você terminar a próxima
sessão, peça pro Claude Code editar este HANDOFF.md com o novo estado.
