# Visão do Produto — RAFA-RJ

> Última atualização: 13/05/2026
> Autor: Guilherme Ettore (definição) · IA Claude (transcrição)

---

## O que estamos construindo

**RAFA-RJ** — uma rede social interna do setor SSIE-RJ (Subsecretaria de
Avaliação de Cenários e Inteligência Estratégica), fechada e privada, onde a
equipe colabora em tempo real na coleta e análise de informações de OSINT
(Open Source Intelligence). Tem um assistente de IA embutido chamado **Argus**
que automatiza ingestão, classificação e busca.

> **Nomenclatura oficial:**
> - **RAFA-RJ** = nome do sistema/plataforma (a rede social em si)
> - **Argus** = nome da IA assistente dentro do RAFA-RJ

**Não é** uma rede social aberta. **Não é** um painel solitário. É um espaço
compartilhado, controlado e didático onde **o que um vê, todos veem** (com
exceções configuráveis por post).

## Princípio número 1 — Ferramenta FUNCIONAL

> "Tem que ser algo que seja útil. Se não for funcional, a ferramenta não vai
> ser usada." — Guilherme

Decisões de design devem priorizar:

1. **Botões que funcionam de verdade** (não placeholders ou stubs)
2. **Informação fluindo entre todo mundo em tempo real**
3. **Servidor sempre de pé**
4. **Didático** — quem entra no site pela primeira vez tem que entender
5. **Anti-duplicação** — sistema impede trabalho repetido entre colegas
6. **Atribuição** — cada ação tem autor visível

Princípios secundários (densidade visual, modo escuro, recursos avançados)
ficam ABAIXO desses cinco.

## Usuários

- **5 a 20 pessoas** no total
- Acesso é fechado: o Guilherme libera nominalmente quem pode entrar
- Exemplos atuais: Guilherme Ettore, André Fanara, Cláudio, Carlos
- Trabalham na mesma sala/setor → contexto compartilhado, comunicação fluida

## Linha de produção (divisão de trabalho)

Trabalho que hoje uma pessoa faz sozinha (caçar + documentar + analisar +
relatar) passa a ser distribuído em papéis. Cada item nasce em um papel e
flui pro próximo:

```
🔎 CAÇADOR  →  📸 DOCUMENTADOR  →  🧠 ANALISTA  →  📄 RELATOR
   (link)      (print + texto)     (classifica)   (relatório Cronos)
```

Cada papel tem uma "fila" no painel:

- **Fila do Caçador** — campo "cole o link aqui" + sugestão do dia pelo Claude
- **Fila do Documentador** — links jogados pelos caçadores, esperando print
- **Fila do Analista** — itens documentados aguardando classificação de risco
- **Fila do Relator** — itens classificados prontos pra virar relatório

Uma pessoa pode acumular papéis (ex: Guilherme caça + documenta + analisa).
Mas o sistema registra QUAL papel a pessoa exerceu em cada item.

## Regras importantes de comportamento

1. **Deduplicação por URL** — se o link já foi adicionado por outro colega,
   sistema bloqueia e mostra: "⚠️ Já coletado por André em 13/05 às 10:23".
   Pode comentar/anotar no item dele, mas não duplicar.

2. **Visibilidade por post** — autor escolhe:
   - 🌐 **Público** (todo mundo do GSI)
   - 🔒 **Só eu**
   - 👥 **Selecionados** (lista de quem pode ver)
   - 🚫 **Todos menos selecionados** (lista de quem NÃO pode ver)

3. **Feed em tempo real** — atualiza sozinho a cada 10s. Quando o André posta,
   aparece no painel do Guilherme com um badge "🆕 novo".

4. **Identidade** — todo item mostra "👤 Autor · 🕐 horário relativo"
   (ex: "André · há 12 min").

5. **Tudo é registrado** — quem coletou, quem editou, quem virou relatório.
   Auditoria nativa.

## Funcionalidades estilo rede social

- ❤️ **Curtir** (sinaliza "achei relevante")
- 💬 **Comentar** (debate sobre o item)
- ⭐ **Marcar como importante** (vai pra fila do Relator)
- 🔗 **Compartilhar internamente** (cita um colega no comentário)
- 🔍 **Buscar** (texto livre no feed)
- 🏷 **Filtrar** por autor, rede, palavra-chave, manifestação relacionada

## O que NÃO é

- ❌ Não é um painel de BI (Power BI, Tableau)
- ❌ Não é um sistema de tickets (Jira, Trello)
- ❌ Não é um CRM
- ❌ Não é uma rede social aberta (não tem cadastro público)

## Próximos passos do desenvolvimento

- [ ] Decidir hospedagem do servidor (PC fixo no GSI vs Vercel+Turso vs VPS)
- [ ] Backend mínimo: SQLite + login real + endpoints + sessão
- [ ] Refazer a aba "Redes Sociais" pra virar o FEED principal
- [ ] Aumentar tamanho de texto, imagem e cards (UX legível)
- [ ] Ingestão Inteligente: Print, Ponte Grok, URL
- [ ] Deduplicação por URL
- [ ] Visibilidade por post
- [ ] Curtir/comentar/marcar
- [ ] Polling em tempo real (10s)
- [ ] Migrar Manifestações, Agenda e Relatórios pro mesmo modelo compartilhado
