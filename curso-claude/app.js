/* ============================================================
   ACADEMIA CLAUDE — lógica do curso
   Navegação · progresso (localStorage) · quizzes · jogo ·
   biblioteca de prompts · certificado em imagem · confete
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Estado e persistência ---------------- */
  const CHAVE = "academiaClaude.v2";

  const MODULOS = {
    n1: ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5"],
    n2: ["m2-1", "m2-2", "m2-3", "m2-4", "m2-5", "m2-6"],
    n3: ["m3-1", "m3-2", "m3-3", "m3-4", "m3-5"],
  };
  const QUIZ_DO_NIVEL = { n1: "quiz1", n2: "quiz2", n3: "quiz3" };
  const NOME_TELA = {
    catalogo: "Cursos", inicio: "Curso do Claude", tutor: "Tutor IA", meucurso: "Meu curso personalizado",
    n1: "Nível 1 · Iniciante", n2: "Nível 2 · Intermediário",
    n3: "Nível 3 · Avançado", prompts: "Biblioteca de Prompts", jogo: "Jogos", final: "Certificado",
  };

  let estado = {
    feitos: {},
    quizes: {},
    missoes: {},
    jogo: { recorde: 0, passou: false },
    oficina: { melhor: 0, passou: false },
    desafio: { melhor: 0, passou: false },
    tutorHistorico: [],
    perfil: null,
    nome: "",
    ultimaTela: "",
    certComemorado: false,
    fonte: 16,
    iosBannerFechado: false,
    senior: false,
    vozNome: "",
    vozVel: 1,
  };
  const VOZ_VELOCIDADES = [0.5, 1, 1.5, 2];

  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo === "object") estado = Object.assign(estado, salvo);
  } catch (e) { /* primeiro acesso */ }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
  }

  /* ---------------- Toast ---------------- */
  const toast = document.getElementById("toast");
  let toastTimer = null;
  function avisar(msg) {
    toast.textContent = msg;
    toast.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visivel"), 2200);
  }

  /* ---------------- Confete ---------------- */
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  let confetes = [], confeteAnim = null;

  function festejar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cores = ["#E8825A", "#F2A05E", "#7FB97F", "#7FA8D9", "#B79FE0", "#E8B05A"];
    for (let i = 0; i < 120; i++) {
      confetes.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 2.2,
        vy: 2 + Math.random() * 3.5,
        tam: 5 + Math.random() * 6,
        cor: cores[(Math.random() * cores.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
      });
    }
    if (!confeteAnim) animarConfete();
  }

  function animarConfete() {
    confeteAnim = requestAnimationFrame(animarConfete);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetes.forEach((c) => {
      c.x += c.vx; c.y += c.vy; c.rot += c.vr;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.cor;
      ctx.fillRect(-c.tam / 2, -c.tam / 2, c.tam, c.tam * 0.6);
      ctx.restore();
    });
    confetes = confetes.filter((c) => c.y < canvas.height + 30);
    if (confetes.length === 0) {
      cancelAnimationFrame(confeteAnim);
      confeteAnim = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ---------------- Copiar para a área de transferência ---------------- */
  function copiarTexto(texto) {
    const finaliza = () => avisar("📋 Prompt copiado! Cole no Claude.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(finaliza).catch(() => copiarFallback(texto, finaliza));
    } else {
      copiarFallback(texto, finaliza);
    }
  }
  function copiarFallback(texto, depois) {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); depois(); } catch (e) { avisar("Não consegui copiar 😕"); }
    document.body.removeChild(ta);
  }

  /* ---------------- Navegação entre telas ---------------- */
  const telas = document.querySelectorAll("[data-tela]");
  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menuBtn");

  function mostrarTela(id) {
    telas.forEach((t) => t.classList.toggle("oculto", t.dataset.tela !== id));
    // contexto: vitrine (catálogo) x dentro de um curso → controla o que a interface mostra
    document.body.dataset.ctx = (id === "catalogo") ? "catalogo" : "curso";
    document.querySelectorAll(".menu a").forEach((a) =>
      a.classList.toggle("ativo", a.dataset.nav === id)
    );
    document.querySelectorAll(".tabbar .tab").forEach((b) =>
      b.classList.toggle("ativo", b.dataset.nav === id)
    );
    menu.classList.remove("aberto");
    menuBtn.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    if (id !== "inicio" && id !== "catalogo") { estado.ultimaTela = id; salvar(); }
    atualizarContinuar();
  }

  // Botão "Começar/Continuar" na home do curso: aponta para o nível certo
  function atualizarContinuar() {
    const btn = document.getElementById("comecarCursoBtn");
    if (!btn) return;
    let alvo = "n1", rotulo = "▶ Começar pelo Nível 1";
    const niveis = ["n1", "n2", "n3"];
    const proximo = niveis.find((n) => !nivelCompleto(n));
    if (!proximo) { alvo = "final"; rotulo = "🏆 Ver meu certificado"; }
    else if (estado.ultimaTela && niveis.includes(estado.ultimaTela)) {
      alvo = estado.ultimaTela; rotulo = "▶ Continuar no " + NOME_TELA[alvo];
    } else if (proximo !== "n1") { alvo = proximo; rotulo = "▶ Continuar no " + NOME_TELA[proximo]; }
    btn.dataset.nav = alvo;
    btn.textContent = rotulo;
  }

  document.addEventListener("click", (ev) => {
    const alvo = ev.target.closest("[data-nav]");
    if (!alvo) return;
    ev.preventDefault();
    mostrarTela(alvo.dataset.nav);
    atualizarTudo();
  });

  menuBtn.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    menuBtn.setAttribute("aria-expanded", String(aberto));
  });

  /* ---------------- Progresso ---------------- */
  function nivelCompleto(nivel) {
    const modsOk = MODULOS[nivel].every((m) => estado.feitos[m]);
    const quiz = estado.quizes[QUIZ_DO_NIVEL[nivel]];
    return modsOk && !!(quiz && quiz.passou);
  }

  function atualizarProgresso() {
    let total = 0, feitos = 0;

    Object.keys(MODULOS).forEach((nivel) => {
      const mods = MODULOS[nivel];
      const quiz = estado.quizes[QUIZ_DO_NIVEL[nivel]];
      const feitosNivel =
        mods.filter((m) => estado.feitos[m]).length + (quiz && quiz.passou ? 1 : 0);
      const totalNivel = mods.length + 1;
      total += totalNivel; feitos += feitosNivel;

      const barra = document.querySelector(`[data-barra-nivel="${nivel}"]`);
      if (barra) barra.style.width = (feitosNivel / totalNivel) * 100 + "%";

      const prog = document.querySelector(`[data-prog-nivel="${nivel}"]`);
      if (prog) {
        prog.textContent = feitosNivel >= totalNivel
          ? "✓ Nível completo!"
          : `${feitosNivel}/${totalNivel} etapas`;
        const cartao = prog.closest(".roadmap-item, .trilha-card");
        if (cartao) cartao.classList.toggle("completo", feitosNivel >= totalNivel);
      }
    });

    total += 1; if (estado.jogo.passou) feitos += 1;

    const pct = Math.round((feitos / total) * 100);
    const barraGeral = document.getElementById("barraGeral");
    const texto = document.getElementById("progressoTexto");
    if (barraGeral) barraGeral.style.width = pct + "%";
    if (texto) texto.textContent = pct + "%";

    // rótulo no card do curso, na vitrine
    const catProg = document.getElementById("catProgClaude");
    if (catProg) catProg.textContent = pct === 0 ? "Começar curso →"
      : pct >= 100 ? "✓ Concluído — rever" : `Continuar (${pct}%) →`;
  }

  function atualizarModulos() {
    document.querySelectorAll("[data-concluir]").forEach((btn) => {
      const id = btn.dataset.concluir;
      const feito = !!estado.feitos[id];
      btn.classList.toggle("feito", feito);
      btn.textContent = feito ? "✓ Etapa concluída" : "✓ Concluir etapa";
      const mod = btn.closest("[data-modulo]");
      if (mod) mod.classList.toggle("feito", feito);
    });
  }

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-concluir]");
    if (!btn) return;
    const id = btn.dataset.concluir;
    estado.feitos[id] = !estado.feitos[id];
    salvar();
    atualizarTudo();
  });

  /* ---------------- Cartões flip ---------------- */
  document.querySelectorAll(".cartao-modelo").forEach((c) => {
    c.addEventListener("click", () => c.classList.toggle("virado"));
  });

  /* ---------------- Claude na sua profissão (m2-5) ---------------- */
  const AREAS = {
    vendas: [
      ["Propostas em minutos", "Mande os dados do cliente e peça uma proposta personalizada seguindo seu modelo (suba o modelo num Projeto).", "Com base no modelo de proposta do projeto, crie uma proposta para a empresa X, que precisa de [serviço], orçamento de R$ [valor]."],
      ["Preparação de reunião", "Antes de visitar um cliente, peça um resumo da empresa dele com a pesquisa na web.", "Pesquise a empresa [nome] e me dê: o que fazem, notícias recentes e 3 ganchos de conversa para uma reunião de vendas."],
      ["Respostas a objeções", "Treine respostas para as objeções mais comuns dos seus clientes.", "Sou vendedor de [produto]. Liste as 5 objeções mais comuns e uma resposta convincente e honesta para cada."],
      ["Follow-up que converte", "E-mails de acompanhamento personalizados em segundos.", "Escreva um follow-up curto e cordial para um cliente que pediu a proposta há 5 dias e não respondeu. Tom leve, sem pressão."],
    ],
    marketing: [
      ["Calendário de conteúdo", "Um mês de pauta para redes sociais em uma conversa.", "Crie um calendário de conteúdo de 4 semanas para o Instagram de [negócio], público [descrição]: 3 posts/semana com tema, legenda e ideia visual."],
      ["Textos no tom da marca", "Crie um Projeto com o manual da marca e exemplos de posts — tudo sai no tom certo.", "Seguindo o tom de voz do projeto, escreva 3 variações de legenda para o lançamento de [produto]."],
      ["Análise de campanha", "Suba o CSV de resultados e peça a análise.", "Analise esta planilha de resultados de anúncios e me diga: o que está performando, o que cortar e 3 testes para o próximo mês."],
      ["Landing page com Artifacts", "Peça uma página de captura pronta para visualizar.", "Crie uma landing page para [oferta], com título forte, 3 benefícios, depoimentos e botão de WhatsApp. Cores: [suas cores]."],
    ],
    adm: [
      ["Planilhas sem sofrimento", "Peça fórmulas, organize dados, encontre erros.", "Tenho uma planilha com [descrição]. Me dê a fórmula para [objetivo] e explique como aplicar."],
      ["Atas e resumos de reunião", "Cole a transcrição ou suas anotações e receba a ata pronta.", "Transforme estas anotações em uma ata profissional com: participantes, decisões, pendências e responsáveis."],
      ["E-mails difíceis", "Cobranças, negativas e comunicados delicados com o tom certo.", "Escreva um e-mail cobrando educadamente a fatura vencida há 15 dias do cliente [nome], mantendo o bom relacionamento."],
      ["Processos documentados", "Transforme o conhecimento da equipe em manuais.", "Vou descrever como fazemos [processo]. Transforme num passo a passo claro para treinar novos funcionários."],
    ],
    juridico: [
      ["Resumo de documentos extensos", "Contratos e processos de centenas de páginas resumidos com referências.", "Resuma este contrato destacando: partes, obrigações, prazos, multas e cláusulas que merecem atenção."],
      ["Comparação de versões", "Encontre o que mudou entre duas versões de um contrato.", "Compare estes dois contratos e liste todas as diferenças relevantes em uma tabela."],
      ["Primeira minuta", "Rascunhos de petições e contratos para você lapidar (sempre com revisão!).", "Crie uma minuta de contrato de prestação de serviços de [tipo], com cláusulas de confidencialidade e rescisão. Vou revisar e adaptar."],
      ["Linguagem simples para o cliente", "Traduza juridiquês para o cliente entender.", "Explique esta cláusula em linguagem simples, como se fosse para um cliente leigo, sem perder a precisão."],
    ],
    educacao: [
      ["Planos de aula", "Aulas completas alinhadas ao seu currículo.", "Crie um plano de aula de 50 min sobre [tema] para [série], com objetivo, atividade prática e avaliação rápida."],
      ["Provas e exercícios", "Listas de exercícios com gabarito em segundos.", "Crie 10 questões sobre [tema], do básico ao avançado, com gabarito comentado."],
      ["Adaptação de material", "Adapte o mesmo conteúdo para níveis diferentes.", "Adapte este texto para alunos com dificuldade de leitura, mantendo o conteúdo essencial."],
      ["Feedback de redações", "Correções construtivas e padronizadas.", "Corrija esta redação apontando: 3 pontos fortes, 3 melhorias e uma nota de 0 a 10 com justificativa."],
    ],
    saude: [
      ["Material para pacientes", "Orientações claras e acolhedoras (sem substituir a consulta).", "Crie uma orientação pós-procedimento de [procedimento] em linguagem simples e acolhedora, em formato de lista."],
      ["Resumo de literatura", "Acompanhe estudos e diretrizes com a pesquisa na web.", "Pesquise as diretrizes mais recentes sobre [tema] e resuma as principais recomendações com as fontes."],
      ["Gestão do consultório", "Mensagens, lembretes e processos da clínica.", "Crie 3 modelos de mensagem de WhatsApp para lembrar consultas: 1 semana antes, 1 dia antes e no dia."],
      ["Apresentações e aulas", "Slides e material didático para equipe ou congressos.", "Estruture uma apresentação de 15 min sobre [tema] para [público], com roteiro slide a slide."],
    ],
    dev: [
      ["Código mais rápido", "Gere, corrija e refatore com o Claude Code direto no projeto.", "claude → 'encontre por que o login falha quando o e-mail tem maiúsculas e corrija'"],
      ["Entender projetos legados", "Chegue num código desconhecido e peça o mapa.", "Explique a arquitetura deste projeto: principais módulos, fluxo de dados e onde ficam as regras de negócio."],
      ["Testes e documentação", "As partes chatas, automatizadas.", "Escreva testes unitários para este arquivo cobrindo os casos extremos, e documente as funções públicas."],
      ["Code review automático", "Integre ao GitHub para revisar cada pull request.", "Revise este diff como um sênior: bugs, segurança, performance e legibilidade. Seja direto."],
    ],
    autonomo: [
      ["Seu 'sócio' administrativo", "Orçamentos, recibos, controle de clientes — tudo mais rápido.", "Crie um modelo de orçamento profissional para meu serviço de [serviço], com escopo, prazo, valor e condições."],
      ["Divulgação sem agência", "Posts, panfletos e anúncios feitos por você.", "Crie o texto de um anúncio de WhatsApp/Instagram para [serviço] na região de [bairro], com chamada para ação."],
      ["Precificação", "Pense o preço com método, não no chute.", "Me ajude a precificar [serviço]: considere custos de [lista], horas envolvidas e margem de [X]%. Mostre o cálculo."],
      ["Atendimento padronizado", "Respostas prontas para as perguntas que sempre chegam.", "Crie respostas modelo para as 6 perguntas mais comuns de clientes de [tipo de serviço], em tom simpático."],
    ],
  };

  const areaConteudo = document.getElementById("areaConteudo");
  function mostrarArea(area) {
    if (!areaConteudo) return;
    areaConteudo.innerHTML = AREAS[area]
      .map(
        ([titulo, desc, prompt]) => `
      <div class="area-ideia">
        <h5>${titulo}</h5>
        <p>${desc}</p>
        <div class="area-prompt"><b>Prompt:</b> <span class="texto-prompt">${prompt}</span>
          <button class="btn-copiar" data-copiar="${prompt.replace(/"/g, "&quot;")}">copiar</button>
        </div>
      </div>`
      )
      .join("");
  }
  document.querySelectorAll(".area-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#areasBotoes .area-btn").forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      mostrarArea(btn.dataset.area);
    });
  });
  mostrarArea("vendas");

  /* Botões "copiar" (delegação global — funciona em prompts e biblioteca) */
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-copiar]");
    if (!btn) return;
    ev.stopPropagation();
    copiarTexto(btn.dataset.copiar);
  });

  /* ---------------- Biblioteca de prompts ---------------- */
  const PROMPTS = [
    ["Trabalho", "Resumo executivo", "Resuma este documento em 5 pontos para um executivo sem tempo: o essencial, os números importantes e a decisão que precisa ser tomada."],
    ["Trabalho", "E-mail profissional", "Escreva um e-mail [formal/descontraído] para [destinatário] sobre [assunto]. Objetivo: [o que você quer que aconteça]. Máximo 6 linhas."],
    ["Trabalho", "Apresentação pronta", "Estruture uma apresentação de [N] slides sobre [tema] para [público]. Para cada slide: título, 3 bullets e sugestão visual."],
    ["Trabalho", "Ata de reunião", "Transforme estas anotações em ata profissional: participantes, decisões tomadas, pendências com responsável e prazo. Anotações: [cole aqui]."],
    ["Estudos", "Professor particular", "Me explique [assunto] como se eu tivesse [idade/nível]. Use analogias do dia a dia. Depois, faça 3 perguntas para testar se eu entendi."],
    ["Estudos", "Plano de estudos", "Crie um plano de estudos de [N semanas] para aprender [assunto], com [X horas] por semana. Divida por semana e inclua metas verificáveis."],
    ["Estudos", "Simulado de prova", "Crie um simulado de 10 questões sobre [matéria] no estilo [ENEM/concurso/prova da faculdade], com gabarito comentado no final."],
    ["Estudos", "Resumo de aula", "Transforme este texto/transcrição em um resumo de estudo: conceitos-chave em negrito, exemplos e um mapa mental em texto. Material: [cole aqui]."],
    ["Escrita", "Destravar texto", "Estou travado neste texto: [cole o que tem]. Me dê 3 caminhos diferentes para continuar, com o primeiro parágrafo de cada um."],
    ["Escrita", "Revisão completa", "Revise este texto em 3 níveis: erros de português, clareza das frases e força dos argumentos. Mostre as mudanças e explique as principais."],
    ["Escrita", "Adaptar o tom", "Reescreva este texto em tom [formal/descontraído/vendedor/acadêmico], mantendo todas as informações: [cole aqui]."],
    ["Dia a dia", "Decisão difícil", "Estou decidindo entre [opção A] e [opção B]. Considere [seus critérios]. Monte uma tabela de prós e contras e me faça as perguntas que eu não pensei."],
    ["Dia a dia", "Planejar viagem", "Monte um roteiro de [N] dias em [destino] com orçamento de R$ [valor]: o que fazer por dia, onde comer e dicas locais. Estilo: [praia/cultura/família]."],
    ["Dia a dia", "Cardápio da semana", "Crie um cardápio semanal para [N pessoas], orçamento de R$ [valor], considerando [restrições]. Inclua a lista de compras consolidada."],
    ["Negócios", "Plano simples de negócio", "Tenho a ideia de [descreva]. Monte um mini-plano: público, proposta de valor, como cobrar, custos iniciais, 3 riscos e primeiros 5 passos."],
    ["Negócios", "Pesquisa de concorrentes", "Pesquise na web os principais concorrentes de [negócio] em [cidade/segmento] e compare: preços, pontos fortes e onde posso me diferenciar."],
    ["Negócios", "Descrição de vaga", "Crie a descrição da vaga de [cargo]: responsabilidades, requisitos (separando obrigatórios de desejáveis) e um parágrafo vendendo a empresa."],
    ["Criativo", "Ideias fora da caixa", "Me dê 10 ideias criativas para [objetivo]. As 5 primeiras seguras, as 5 últimas bem ousadas. Uma frase explicando cada."],
    ["Criativo", "História personalizada", "Crie uma história infantil de 5 minutos para [nome], de [idade] anos, que adora [tema]. Com moral sobre [valor] e final feliz."],
    ["Criativo", "Nomes e slogans", "Gere 15 opções de nome para [negócio/produto], em 3 estilos: descritivos, criativos e curtos. Para os 3 melhores, sugira um slogan."],
  ];

  const promptsGrade = document.getElementById("promptsGrade");
  const promptsFiltros = document.getElementById("promptsFiltros");

  if (promptsGrade && promptsFiltros) {
    const categorias = ["Todos"].concat([...new Set(PROMPTS.map((p) => p[0]))]);
    promptsFiltros.innerHTML = categorias
      .map((c, i) => `<button class="area-btn ${i === 0 ? "ativo" : ""}" data-cat="${c}">${c}</button>`)
      .join("");

    function renderPrompts(cat) {
      const lista = cat === "Todos" ? PROMPTS : PROMPTS.filter((p) => p[0] === cat);
      promptsGrade.innerHTML = lista
        .map(
          ([categoria, titulo, texto]) => `
        <div class="prompt-card">
          <div class="prompt-card-topo">
            <h5>${titulo}</h5>
            <span class="prompt-card-cat">${categoria}</span>
          </div>
          <p class="prompt-card-texto">${texto}</p>
          <button class="btn-copiar" data-copiar="${texto.replace(/"/g, "&quot;")}">📋 copiar</button>
        </div>`
        )
        .join("");
    }

    promptsFiltros.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-cat]");
      if (!btn) return;
      promptsFiltros.querySelectorAll(".area-btn").forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      renderPrompts(btn.dataset.cat);
    });

    renderPrompts("Todos");
  }

  /* ---------------- Perguntas dos quizzes ---------------- */
  const PERGUNTAS = {
    quiz1: [
      { p: "Quem criou o Claude?", o: ["Google", "Anthropic", "OpenAI", "Meta"], c: 1,
        e: "O Claude é da Anthropic, empresa focada em segurança de IA fundada em 2021." },
      { p: "O que é um 'token'?", o: ["Uma senha de acesso", "O pedacinho de texto que a IA lê e escreve", "Um tipo de modelo", "Uma moeda virtual"], c: 1,
        e: "Token é a unidade de texto da IA — uma palavra tem em média 1 a 3 tokens." },
      { p: "Qual modelo é o mais rápido e barato da família?", o: ["Opus 4.8", "Sonnet 4.6", "Haiku 4.5", "Fable 5"], c: 2,
        e: "O Haiku é o 'motoboy': ideal para tarefas simples e em grande volume." },
      { p: "Para uma tarefa do dia a dia (escrever um e-mail, revisar um texto), o melhor ponto de partida é…", o: ["Fable 5, sempre o melhor", "Haiku, sempre o mais barato", "Sonnet, o equilibrado", "Tanto faz"], c: 2,
        e: "A regra de bolso: comece pelo Sonnet; desça pro Haiku se for simples, suba pro Opus se for complexo." },
      { p: "O que faz o 'pensamento estendido'?", o: ["Aumenta o limite de mensagens", "Deixa o Claude raciocinar mais antes de responder", "Traduz a resposta", "Salva a conversa"], c: 1,
        e: "Com o modo de raciocínio ligado, o Claude pensa por mais tempo — ótimo para problemas difíceis." },
      { p: "Qual a 'janela de contexto' dos modelos atuais como o Sonnet 4.6?", o: ["1 mil tokens", "200 tokens", "1 milhão de tokens", "Ilimitada"], c: 2,
        e: "Sonnet, Opus e Fable trabalham com até 1 milhão de tokens; o Haiku, 200 mil." },
      { p: "No claude.ai (site/app), você paga…", o: ["Por token usado", "Assinatura (ou usa o plano grátis)", "Por conversa", "Por modelo baixado"], c: 1,
        e: "Assinatura é no claude.ai; pagar por token é só na API, para desenvolvedores." },
      { p: "A IA 'alucinou'. O que isso significa?", o: ["Travou", "Inventou uma informação com confiança", "Repetiu a resposta", "Mudou de idioma"], c: 1,
        e: "Alucinação é quando a IA afirma algo falso com convicção — por isso, confira dados importantes." },
      { p: "Qual hábito melhora a qualidade das respostas?", o: ["Misturar todos os assuntos numa conversa só", "Um assunto por conversa", "Escrever sempre em inglês", "Usar frases de uma palavra"], c: 1,
        e: "Um assunto = uma conversa. Contexto focado gera resposta focada." },
      { p: "O que é o Fable 5?", o: ["Um plano de assinatura", "O modelo mais avançado, primeiro da família Claude 5", "Um conector", "O app de desktop"], c: 1,
        e: "Fable 5 é o topo de linha — primeiro modelo da família Claude 5, para os problemas mais difíceis." },
      { p: "Você precisa classificar 5.000 mensagens de clientes como 'elogio' ou 'reclamação'. Qual modelo é o mais indicado?", o: ["Opus, é o mais inteligente", "Haiku, rápido e barato para volume", "Fable, custo não importa", "Nenhum consegue"], c: 1,
        e: "Tarefa simples em grande volume é a especialidade do Haiku: rápido e econômico." },
      { p: "Qual prompt vai gerar a MELHOR resposta?", o: ["'escreve sobre cachorro'", "'Escreva um texto de 3 parágrafos para um folheto de adoção de cães, tom emocional'", "'cachorro'", "'me ajuda aí'"], c: 1,
        e: "Contexto + formato + objetivo = resposta certeira. Detalhes melhoram tudo." },
      { p: "A Anthropic foi fundada em que ano?", o: ["2015", "2021", "2024", "1999"], c: 1,
        e: "A Anthropic foi fundada em 2021, com foco em segurança de IA." },
      { p: "Você quer uma resposta mais rápida e não precisa de raciocínio profundo. O que fazer?", o: ["Desligar o pensamento estendido", "Ligar o pensamento estendido", "Trocar de idioma", "Apagar o histórico"], c: 0,
        e: "Pensamento estendido desligado = respostas mais rápidas, ideal para perguntas simples." },
      { p: "Aproximadamente quantos tokens tem a palavra 'computador'?", o: ["Exatamente 1", "Entre 1 e 3", "Mais de 50", "Nenhum"], c: 1,
        e: "Em média uma palavra tem de 1 a 3 tokens." },
      { p: "Onde NÃO se paga por token, e sim assinatura fixa?", o: ["No claude.ai (site e app)", "Na API", "No Claude Code com chave de API", "Em lugar nenhum"], c: 0,
        e: "No claude.ai você paga assinatura. Pagar por token é só na API." },
      { p: "Você está num projeto difícil de matemática. Qual recurso ajuda mais?", o: ["A pesquisa na web", "O pensamento estendido (modo de raciocínio)", "Mudar a fonte", "O modo escuro"], c: 1,
        e: "Para lógica e cálculo, ligue o pensamento estendido — ele raciocina com mais cuidado." },
      { p: "Por que é bom começar uma conversa nova para cada assunto?", o: ["Para gastar menos bateria", "Para manter o contexto focado e melhorar as respostas", "Porque é obrigatório", "Para deixar o app mais bonito"], c: 1,
        e: "Um assunto por conversa mantém o contexto limpo e as respostas mais precisas." },
      { p: "O que você deve fazer com uma informação importante que a IA te deu?", o: ["Confiar 100% sempre", "Conferir, pois a IA pode 'alucinar'", "Ignorar", "Apagar"], c: 1,
        e: "A IA pode inventar com confiança. Sempre confira dados importantes." },
    ],
    quiz2: [
      { p: "O que é um Projeto no claude.ai?", o: ["Um arquivo de código", "Uma pasta inteligente com instruções e arquivos fixos", "Um modelo personalizado", "Um plano pago"], c: 1,
        e: "Projetos agrupam conversas e dão ao Claude instruções e conhecimento permanentes sobre um tema." },
      { p: "O que são Artifacts?", o: ["Erros do sistema", "Painéis com 'produtos prontos': docs, sites, mini-apps", "Plugins pagos", "Backups de conversa"], c: 1,
        e: "Quando você pede algo 'pronto' (um app, um documento), o Claude monta num painel editável ao lado do chat." },
      { p: "O que significa MCP?", o: ["Modelo de Conversa Privada", "Model Context Protocol — o 'USB das IAs'", "Multi Claude Program", "Memória de Curto Prazo"], c: 1,
        e: "MCP é o padrão aberto criado pela Anthropic que conecta ferramentas a assistentes de IA." },
      { p: "Onde você ativa um conector no claude.ai?", o: ["Configurações → Conectores", "Na loja de aplicativos", "Pedindo no chat", "Não dá para ativar"], c: 0,
        e: "Settings/Configurações → Conectores: escolha no diretório, conecte e autorize." },
      { p: "Com o conector do Google Drive ativo, você pode pedir…", o: ["'Formate meu computador'", "'Resuma o documento X que está no meu Drive'", "'Aumente minha internet'", "Nada muda"], c: 1,
        e: "Conectores deixam o Claude acessar suas ferramentas reais — sempre com sua autorização." },
      { p: "Como se adiciona um conector que não está no diretório?", o: ["Não tem como", "Pelo endereço (URL) do servidor MCP dele, em 'conector personalizado'", "Baixando um .exe", "Pedindo por e-mail à Anthropic"], c: 1,
        e: "Se a ferramenta tem servidor MCP, dá para adicionar pela URL em Configurações → Conectores." },
      { p: "Qual técnica melhora MUITO um prompt profissional?", o: ["Escrever tudo em maiúsculas", "Definir um papel/persona e mostrar exemplos", "Usar frases bem curtas sempre", "Repetir o pedido 3 vezes"], c: 1,
        e: "Persona + exemplos + formato definido = respostas no padrão que você precisa." },
      { p: "Para saber a cotação do dólar de hoje, o ideal é…", o: ["Perguntar direto, ele sempre sabe", "Ativar a pesquisa na web", "Usar o Haiku", "Criar um Projeto"], c: 1,
        e: "O conhecimento do modelo tem data de corte; para informação atual, use a pesquisa na web." },
      { p: "A 'pesquisa profunda' serve para…", o: ["Buscar arquivos no seu celular", "Investigar um tema por vários minutos e entregar relatório com fontes", "Apagar histórico", "Acelerar respostas"], c: 1,
        e: "É o modo de pesquisa avançada: o Claude investiga a fundo e devolve um relatório com referências." },
      { p: "A 'memória' do Claude serve para…", o: ["Gravar sua tela", "Lembrar informações suas entre conversas (e você pode apagar)", "Acelerar o wi-fi", "Salvar senhas"], c: 1,
        e: "Ele pode lembrar preferências e contexto entre conversas — com transparência e controle seu." },
      { p: "Você quer que o Claude sempre responda no tom da sua empresa, sem repetir as regras toda vez. O que usar?", o: ["Um Artifact", "Um Projeto com instruções fixas", "A pesquisa na web", "O modo de voz"], c: 1,
        e: "Projetos guardam instruções fixas que valem para todas as conversas daquele tema." },
      { p: "Você pede 'crie uma calculadora de orçamento interativa'. O que aparece?", o: ["Um erro", "Um Artifact: um mini-app funcionando ao lado do chat", "Um conector", "Uma cobrança extra"], c: 1,
        e: "Pedidos de 'produtos prontos' viram Artifacts — editáveis e até compartilháveis." },
      { p: "Qual a forma mais poderosa de fazer o Claude escrever no SEU estilo?", o: ["Pedir 'capricha'", "Colar 2-3 exemplos seus e pedir para seguir o padrão", "Escrever em maiúsculas", "Repetir 3 vezes"], c: 1,
        e: "Mostrar exemplos reais transfere o estilo melhor do que qualquer descrição." },
      { p: "Quem criou o padrão MCP que conecta IAs a ferramentas?", o: ["A Microsoft", "A Anthropic", "A Apple", "A Google"], c: 1,
        e: "A Anthropic criou o MCP, hoje usado pelo mercado inteiro — o 'USB das IAs'." },
      { p: "Você tem um relatório grande e uma tarefa enorme e complexa. Qual modelo encara melhor?", o: ["Haiku", "Opus, o especialista autônomo", "Nenhum", "Só humanos"], c: 1,
        e: "Trabalhos longos e complexos são a especialidade do Opus." },
      { p: "Antes de visitar um cliente novo, o que pedir ao Claude?", o: ["Para formatar o PC", "Pesquisar a empresa na web e dar ganchos de conversa", "Apagar a agenda", "Nada útil"], c: 1,
        e: "Com a pesquisa na web, ele levanta dados recentes do cliente para você se preparar." },
      { p: "Como o Claude pode te ajudar com uma planilha de vendas?", o: ["Não trabalha com planilhas", "Você envia o arquivo e ele analisa, acha erros e sugere gráficos", "Só se você digitar tudo de novo", "Apaga a planilha"], c: 1,
        e: "Envie o arquivo e peça conclusões, inconsistências e visualizações." },
      { p: "Uma boa técnica para tarefas grandes é…", o: ["Pedir tudo de uma vez", "Pedir em etapas: primeiro a estrutura, depois cada parte", "Nunca revisar", "Usar uma palavra só"], c: 1,
        e: "Quebrar em etapas e aprovar a estrutura antes garante um resultado muito melhor." },
      { p: "Os conectores acessam suas ferramentas…", o: ["Sem você saber", "Somente com a sua autorização, e você pode desconectar", "De graça e sem limite", "Apenas no Windows"], c: 1,
        e: "Você autoriza cada conector e pode revogar o acesso quando quiser." },
    ],
    quiz3: [
      { p: "Qual a grande diferença do Claude Code para o chat?", o: ["É mais bonito", "Ele AGE: lê arquivos, roda comandos e corrige sozinho", "É grátis", "Só funciona online"], c: 1,
        e: "O Claude Code executa ações no seu computador/projeto — com sua aprovação." },
      { p: "Como se instala o Claude Code?", o: ["npm install -g @anthropic-ai/claude-code", "Baixando da App Store", "Pedindo no chat", "Vem instalado no Windows"], c: 0,
        e: "Com Node.js instalado: npm install -g @anthropic-ai/claude-code, depois rode 'claude' na pasta do projeto." },
      { p: "Para que serve o arquivo CLAUDE.md?", o: ["Guardar senhas", "É o 'manual do projeto' que o Claude lê em toda sessão", "Backup do código", "Lista de erros"], c: 1,
        e: "O /init cria o CLAUDE.md com convenções e comandos do projeto — contexto permanente." },
      { p: "Na API, você paga…", o: ["Assinatura fixa", "Por milhão de tokens de entrada e saída", "Por hora", "Uma vez só"], c: 1,
        e: "API é pagamento por uso: ex. Sonnet 4.6 custa US$ 3 (entrada) / US$ 15 (saída) por milhão de tokens." },
      { p: "O que oferece 50% de desconto na API?", o: ["Cupom de primeiro uso", "O Batch API (tarefas sem pressa)", "Pagar em dólar", "Usar de madrugada"], c: 1,
        e: "O processamento em lote (Batch) custa metade do preço para tarefas que podem esperar." },
      { p: "O 'cache de prompt' da API serve para…", o: ["Salvar suas conversas", "Baratear (até ~90%) contextos que se repetem em cada chamada", "Aumentar a velocidade da internet", "Esconder dados"], c: 1,
        e: "Contexto repetido (instruções, documentos) é cacheado e cobrado muito mais barato nas chamadas seguintes." },
      { p: "Um 'servidor MCP' é…", o: ["Um computador da Anthropic", "Um programa que expõe ferramentas/dados para a IA usar", "Um plano enterprise", "Um antivírus"], c: 1,
        e: "Servidores MCP oferecem ferramentas (ações) e recursos (dados); o Claude é o cliente que os consome." },
      { p: "O que é um 'agente' de IA?", o: ["Um funcionário da Anthropic", "Uma IA que executa um objetivo: planeja, usa ferramentas e verifica", "Um vírus", "Um atalho de teclado"], c: 1,
        e: "Agentes não só respondem: trabalham até concluir a tarefa, usando ferramentas e se auto-corrigindo." },
      { p: "Subagentes servem para…", o: ["Vigiar o usuário", "Dividir um trabalho grande em ajudantes paralelos", "Trocar de idioma", "Economizar bateria"], c: 1,
        e: "O Claude despacha 'ajudantes' em paralelo: um pesquisa, outro escreve, outro revisa." },
      { p: "Qual prática de segurança está ERRADA?", o: ["Revisar documentos importantes", "Colocar a chave da API dentro do código publicado", "Dar permissões mínimas aos conectores", "Conferir números gerados"], c: 1,
        e: "Chave de API é segredo: use variáveis de ambiente e nunca exponha no código." },
      { p: "Você quer automatizar a organização de centenas de arquivos no PC. Qual ferramenta?", o: ["O chat do claude.ai", "O Claude Code (roda e age no seu computador)", "A pesquisa na web", "Um Artifact"], c: 1,
        e: "O Claude Code executa ações no seu computador — perfeito para automatizar tarefas." },
      { p: "Antes de o Claude Code executar uma ação importante, o que acontece?", o: ["Ele faz sem avisar", "Ele mostra o plano e pede sua aprovação", "Ele desliga o PC", "Nada, é automático"], c: 1,
        e: "Você sempre aprova as ações importantes antes de ele executar." },
      { p: "O que você precisa instalar antes do Claude Code?", o: ["O Node.js", "Um antivírus pago", "O Microsoft Word", "Nada"], c: 0,
        e: "Com o Node.js instalado, rode: npm install -g @anthropic-ai/claude-code." },
      { p: "Sua empresa tem milhares de tarefas iguais por mês, sem pressa. O que reduz o custo na API pela metade?", o: ["Pagar em dólar", "O Batch API", "Usar de madrugada", "Trocar de senha"], c: 1,
        e: "O Batch processa em lote com 50% de desconto para tarefas que podem esperar." },
      { p: "Você manda sempre o mesmo manual gigante em cada chamada da API. O que barateia isso?", o: ["O cache de prompt", "Apagar o manual", "Usar o Haiku", "Nada"], c: 0,
        e: "O cache de prompt reaproveita o conteúdo repetido, cobrando até 90% mais barato." },
      { p: "Pense em 'funcionários digitais' cuidando de tarefas repetitivas sozinhos. Isso é…", o: ["Um conector", "Um agente de IA", "Um Artifact", "Um token"], c: 1,
        e: "Agentes executam objetivos: planejam, usam ferramentas e se corrigem até concluir." },
      { p: "Uma 'Skill' no Claude é…", o: ["Um jogo", "Uma apostila que ensina o Claude a fazer algo do jeito da sua empresa", "Um vírus", "Um plano pago"], c: 1,
        e: "Skills dão ao Claude instruções e exemplos do seu padrão, que ele usa quando a tarefa pede." },
      { p: "Pode mandar dados de clientes para a IA?", o: ["Sempre, sem limite", "Só conforme a política da empresa e a LGPD", "Nunca, em hipótese alguma", "Só de madrugada"], c: 1,
        e: "Dados sensíveis seguem a política da empresa e a LGPD. Senhas e chaves, jamais." },
      { p: "Por que só instalar servidores MCP de fontes confiáveis?", o: ["Para economizar internet", "Porque eles executam ações reais nas suas contas e PC", "Para o app ficar bonito", "Não importa a fonte"], c: 1,
        e: "Servidores MCP têm poder real — instale apenas de fontes em que você confia." },
    ],
  };
  const QUIZ_TAM = 10; // perguntas sorteadas por tentativa (de um banco maior)

  /* ---------------- Motor de quiz ---------------- */
  function embaralhar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function montarQuiz(caixa) {
    const id = caixa.dataset.quiz;
    const perguntas = PERGUNTAS[id];
    let ordem = [], atual = 0, pontos = 0;

    const totalSorteado = Math.min(QUIZ_TAM, perguntas.length);

    function telaInicio() {
      const info = estado.quizes[id];
      caixa.innerHTML = `
        <div class="quiz-inicio">
          <p><strong>${totalSorteado} perguntas</strong> sorteadas de um banco de ${perguntas.length} — então
          cada vez que você refizer, vêm perguntas diferentes! Acerte <strong>70% ou mais</strong> para concluir. 😉</p>
          <button class="btn btn-primario" data-acao="comecar">Começar o quiz</button>
          ${info ? `<p class="quiz-recorde">Sua melhor nota: <strong>${info.melhor}%</strong>${info.passou ? " · ✅ etapa concluída" : ""}</p>` : ""}
        </div>`;
    }

    function telaPergunta() {
      const q = ordem[atual];
      const indices = embaralhar(q.o.map((_, i) => i));
      caixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo">
            <span>Pergunta ${atual + 1}/${ordem.length}</span>
            <span>${pontos} acerto${pontos === 1 ? "" : "s"}</span>
          </div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(atual / ordem.length) * 100}%"></div></div>
          <h3 class="quiz-pergunta">${q.p}</h3>
          <div class="quiz-opcoes">
            ${indices.map((i) => `<button class="quiz-opcao" data-opcao="${i}">${q.o[i]}</button>`).join("")}
          </div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-acao="proxima">Próxima →</button>
        </div>`;
    }

    function responder(i) {
      const q = ordem[atual];
      const certo = i === q.c;
      if (certo) pontos++;
      caixa.querySelectorAll(".quiz-opcao").forEach((b) => {
        b.disabled = true;
        const idx = Number(b.dataset.opcao);
        if (idx === q.c) b.classList.add("correta");
        else if (idx === i) b.classList.add("errada");
      });
      const fb = caixa.querySelector(".quiz-feedback");
      fb.textContent = (certo ? "✅ Acertou! " : "❌ Quase! ") + q.e;
      fb.classList.remove("oculto");
      const btn = caixa.querySelector('[data-acao="proxima"]');
      btn.textContent = atual + 1 < ordem.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }

    function telaFim() {
      const pct = Math.round((pontos / ordem.length) * 100);
      const passou = pct >= 70;
      const info = estado.quizes[id] || { melhor: 0, passou: false };
      info.melhor = Math.max(info.melhor, pct);
      info.passou = info.passou || passou;
      estado.quizes[id] = info;
      salvar();
      atualizarTudo();
      if (passou) festejar();

      const titulo = pct === 100 ? "🏆 Perfeito!" : passou ? "🎉 Mandou bem!" : "💪 Quase lá!";
      const msg = passou
        ? "Etapa de quiz concluída — pode seguir em frente."
        : "Você precisa de 70% para concluir. Releia as etapas e tente de novo!";
      caixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${titulo}</h3>
          <p class="quiz-nota">${pct}%</p>
          <p>${pontos} de ${ordem.length} perguntas certas. ${msg}</p>
          ${passou ? '<p class="quiz-selo">✅ Quiz aprovado</p>' : ""}
          <button class="btn btn-primario" data-acao="comecar" style="margin-top:.8rem">Tentar de novo</button>
        </div>`;
    }

    caixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-acao]");
      const opcao = ev.target.closest("[data-opcao]");
      if (acao && acao.dataset.acao === "comecar") {
        ordem = embaralhar(perguntas).slice(0, totalSorteado);
        atual = 0; pontos = 0;
        telaPergunta();
      } else if (acao && acao.dataset.acao === "proxima") {
        atual++;
        if (atual < ordem.length) telaPergunta(); else telaFim();
      } else if (opcao && !opcao.disabled) {
        responder(Number(opcao.dataset.opcao));
      }
    });

    telaInicio();
  }

  document.querySelectorAll(".quiz-caixa[data-quiz]").forEach(montarQuiz);

  /* ---------------- Jogo: Missão Certa ---------------- */
  const MISSOES = [
    { t: "Chegaram 3.000 e-mails de clientes. Classifique cada um como 'reclamação', 'dúvida' ou 'elogio'.", r: "haiku",
      e: "Tarefa simples e em volume gigante: Haiku faz rápido e custa centavos." },
    { t: "Escreva e revise a newsletter semanal da empresa, com bom texto e boa estrutura.", r: "sonnet",
      e: "Texto do dia a dia com qualidade: o equilíbrio do Sonnet é perfeito." },
    { t: "Refatore o sistema legado inteiro da empresa — milhares de arquivos — trabalhando de forma autônoma durante horas.", r: "opus",
      e: "Trabalho longo, complexo e autônomo é a especialidade do Opus." },
    { t: "Um problema de pesquisa que nenhuma IA da empresa conseguiu resolver até hoje. Custo não importa.", r: "fable",
      e: "Quando nem o Opus dá conta, é hora do topo de linha: Fable 5." },
    { t: "Responder automaticamente o chat do site com perguntas frequentes (horário, preço, endereço), milhares de vezes por dia.", r: "haiku",
      e: "Respostas curtas e repetitivas em escala: Haiku, o veloz e econômico." },
    { t: "Analisar o contrato de 80 páginas de um fornecedor e montar um resumo executivo com riscos.", r: "sonnet",
      e: "Análise de documento bem feita, sem complexidade extrema: Sonnet resolve com ótimo custo." },
    { t: "Conduzir uma investigação profunda de mercado por várias horas, cruzando dezenas de fontes, e escrever um relatório estratégico.", r: "opus",
      e: "Pesquisa profunda e longa com raciocínio sofisticado: Opus." },
    { t: "Projetar do zero a arquitetura de um sistema criticamente complexo — o desafio técnico mais difícil da história da empresa.", r: "fable",
      e: "O problema mais difícil de todos pede o modelo mais capaz de todos: Fable 5." },
  ];
  // 15 segundos no normal; 30 no Modo Terceira Idade (mais tempo para ler com calma)
  function tempoMissaoAtual() { return estado.senior ? 30 : 15; }
  let TEMPO_MISSAO = tempoMissaoAtual();
  const PONTUACAO_MAXIMA = MISSOES.length * 100;

  const jogoInicio = document.getElementById("jogoInicio");
  const jogoRodada = document.getElementById("jogoRodada");
  const jogoFim = document.getElementById("jogoFim");

  if (jogoInicio) {
    const elContador = document.getElementById("jogoContador");
    const elPontos = document.getElementById("jogoPontos");
    const elTimer = document.getElementById("jogoTimer");
    const elMissao = document.getElementById("jogoMissaoTexto");
    const elFeedback = document.getElementById("jogoFeedback");
    const elStreak = document.getElementById("jogoStreak");
    const escolhas = Array.from(document.querySelectorAll(".jogo-escolha"));

    let rodada = 0, pontos = 0, sequencia = 0, restante = TEMPO_MISSAO, cronometro = null, ordem = [];

    function mostrarRecorde() {
      const el = document.getElementById("jogoRecorde");
      if (estado.jogo.recorde > 0) {
        el.textContent = `Seu recorde: ${estado.jogo.recorde} pts` +
          (estado.jogo.passou ? " · ✅ desafio concluído" : "");
      }
    }
    mostrarRecorde();

    function iniciarJogo() {
      ordem = embaralhar(MISSOES);
      rodada = 0; pontos = 0; sequencia = 0;
      jogoInicio.classList.add("oculto");
      jogoFim.classList.add("oculto");
      jogoRodada.classList.remove("oculto");
      proximaMissao();
    }

    function proximaMissao() {
      const m = ordem[rodada];
      elContador.textContent = `Missão ${rodada + 1}/${ordem.length}`;
      elPontos.textContent = `${pontos} pts`;
      elStreak.textContent = sequencia >= 2 ? `🔥 x${sequencia}` : "";
      elMissao.textContent = m.t;
      elFeedback.classList.add("oculto");
      escolhas.forEach((b) => { b.disabled = false; b.classList.remove("correta", "errada"); });

      TEMPO_MISSAO = tempoMissaoAtual();
      restante = TEMPO_MISSAO;
      elTimer.style.width = "100%";
      clearInterval(cronometro);
      const telaJogo = document.querySelector('[data-tela="jogo"]');
      cronometro = setInterval(() => {
        // pausa o relógio se a pessoa sair da tela do jogo ou minimizar
        if (document.hidden || telaJogo.classList.contains("oculto")) return;
        restante -= 0.1;
        elTimer.style.width = Math.max(0, (restante / TEMPO_MISSAO) * 100) + "%";
        if (restante <= 0) { clearInterval(cronometro); responderJogo(null); }
      }, 100);
    }

    function responderJogo(modelo) {
      clearInterval(cronometro);
      const m = ordem[rodada];
      const certo = modelo === m.r;
      let ganho = 0, bonus = 0;
      if (certo) {
        sequencia++;
        ganho = Math.max(20, Math.round((restante / TEMPO_MISSAO) * 100));
        bonus = Math.min(30, (sequencia - 1) * 10);
        pontos += ganho + bonus;
      } else {
        sequencia = 0;
      }
      elPontos.textContent = `${pontos} pts`;
      elStreak.textContent = sequencia >= 2 ? `🔥 x${sequencia}` : "";

      escolhas.forEach((b) => {
        b.disabled = true;
        if (b.dataset.modelo === m.r) b.classList.add("correta");
        else if (b.dataset.modelo === modelo) b.classList.add("errada");
      });

      elFeedback.textContent = modelo === null
        ? `⏰ Tempo esgotado! ${m.e}`
        : (certo
            ? `✅ Certo! +${ganho} pts${bonus ? ` (+${bonus} de bônus 🔥)` : ""}. `
            : "❌ Não foi dessa vez. ") + m.e;
      elFeedback.classList.remove("oculto");

      setTimeout(() => {
        rodada++;
        if (rodada < ordem.length) proximaMissao(); else fimDeJogo();
      }, 2600);
    }

    function fimDeJogo() {
      jogoRodada.classList.add("oculto");
      jogoFim.classList.remove("oculto");
      const pct = Math.min(100, Math.round((pontos / PONTUACAO_MAXIMA) * 100));
      const passou = pct >= 50;

      estado.jogo.recorde = Math.max(estado.jogo.recorde, pontos);
      estado.jogo.passou = estado.jogo.passou || passou;
      salvar();
      atualizarTudo();
      if (passou) festejar();

      document.getElementById("jogoResultadoTitulo").textContent =
        pct >= 85 ? "🏆 Gestor de IA lendário!" : passou ? "🎉 Missões cumpridas!" : "💪 Treine e volte!";
      document.getElementById("jogoNota").textContent = `${pontos} pts`;
      document.getElementById("jogoResultadoMsg").textContent =
        `Você fez ${pct}% da pontuação base (${PONTUACAO_MAXIMA} pts, fora os bônus). ` +
        (passou ? "Desafio concluído para o certificado! ✅"
                : "Alcance 50% para contar no certificado.");
      mostrarRecorde();
    }

    document.getElementById("jogoComecar").addEventListener("click", iniciarJogo);
    document.getElementById("jogoReiniciar").addEventListener("click", iniciarJogo);
    escolhas.forEach((b) =>
      b.addEventListener("click", () => { if (!b.disabled) responderJogo(b.dataset.modelo); })
    );
  }

  /* ---------------- Certificado ---------------- */
  function atualizarCertificado() {
    const checks = {
      n1: nivelCompleto("n1"),
      n2: nivelCompleto("n2"),
      n3: nivelCompleto("n3"),
      jogo: estado.jogo.passou,
    };
    document.querySelectorAll("#finalChecklist [data-check]").forEach((li) => {
      li.classList.toggle("ok", !!checks[li.dataset.check]);
    });
    const tudo = Object.values(checks).every(Boolean);
    const cert = document.getElementById("certificado");
    const texto = document.getElementById("finalTexto");
    if (cert) cert.classList.toggle("oculto", !tudo);
    if (texto) texto.textContent = tudo
      ? "Parabéns! Você completou tudo. 👏"
      : "Complete tudo abaixo para liberar seu certificado:";
    const nome = document.getElementById("certNome");
    if (nome && estado.nome) nome.textContent = estado.nome;
    const dataEl = document.getElementById("certData");
    if (dataEl) {
      const d = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      dataEl.textContent = `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    }

    if (tudo && !estado.certComemorado) {
      estado.certComemorado = true;
      salvar();
      festejar();
    }
  }

  const certBtn = document.getElementById("certNomeBtn");
  if (certBtn) {
    certBtn.addEventListener("click", () => {
      const nome = prompt("Digite seu nome para o certificado:");
      if (nome && nome.trim()) {
        estado.nome = nome.trim().slice(0, 60);
        salvar();
        atualizarCertificado();
      }
    });
  }

  /* Imprimir certificado (usa a impressão do navegador → papel ou PDF) */
  const certImprimirBtn = document.getElementById("certImprimirBtn");
  if (certImprimirBtn) {
    certImprimirBtn.addEventListener("click", () => {
      if (!estado.nome) {
        const nome = prompt("Antes de imprimir, digite seu nome para o certificado:");
        if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); }
      }
      document.body.classList.add("imprimindo-cert");
      window.print();
      setTimeout(() => document.body.classList.remove("imprimindo-cert"), 500);
    });
  }
  window.addEventListener("afterprint", () => document.body.classList.remove("imprimindo-cert"));

  /* Desenha o certificado num canvas (reutilizado por PNG e PDF) */
  function desenharCertificado(cb) {
    const fontes = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontes.then(() => {
      const c = document.createElement("canvas");
      c.width = 1200; c.height = 850;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 1200, 850);
      grad.addColorStop(0, "#221E1A"); grad.addColorStop(1, "#1A1714");
      g.fillStyle = grad; g.fillRect(0, 0, 1200, 850);
      const halo = g.createRadialGradient(950, 80, 30, 950, 80, 500);
      halo.addColorStop(0, "rgba(232,130,90,.22)"); halo.addColorStop(1, "rgba(232,130,90,0)");
      g.fillStyle = halo; g.fillRect(0, 0, 1200, 850);
      g.strokeStyle = "#E8825A"; g.lineWidth = 6; g.strokeRect(40, 40, 1120, 770);
      g.strokeStyle = "rgba(232,130,90,.35)"; g.lineWidth = 2; g.strokeRect(58, 58, 1084, 734);
      g.textAlign = "center";
      g.fillStyle = "#F2A05E"; g.font = "700 26px Outfit, sans-serif";
      g.fillText("✳  IMPÉRIO DIGITAL", 600, 140);
      g.fillStyle = "#B8AC9B"; g.font = "22px Outfit, sans-serif";
      g.fillText("CERTIFICADO DE CONCLUSÃO", 600, 185);
      g.fillStyle = "#F2EBE0"; g.font = "italic 600 64px Fraunces, Georgia, serif";
      g.fillText(estado.nome || "Aluno(a)", 600, 320);
      g.fillStyle = "#B8AC9B"; g.font = "26px Outfit, sans-serif";
      g.fillText("concluiu o curso", 600, 390);
      g.fillStyle = "#F2EBE0"; g.font = "600 34px Fraunces, Georgia, serif";
      g.fillText("“Domine o Claude — do zero ao avançado”", 600, 445);
      g.fillStyle = "#B8AC9B"; g.font = "22px Outfit, sans-serif";
      g.fillText("Modelos · Projetos · Artifacts · Conectores MCP · Claude Code · API · Agentes", 600, 505);
      const data = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      g.fillText(`Concluído em ${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`, 600, 580);
      g.fillStyle = "#E8825A"; g.font = "700 24px Outfit, sans-serif";
      g.fillText("🌱 Iniciante   ·   🚀 Intermediário   ·   🧠 Avançado   ·   🎮 Desafio final", 600, 660);
      g.fillStyle = "rgba(184,172,155,.7)"; g.font = "16px Outfit, sans-serif";
      g.fillText("Império Digital · plataforma independente, sem vínculo oficial com a Anthropic", 600, 760);
      cb(c);
    });
  }

  /* Monta um PDF (1 página paisagem) com o JPEG do certificado embutido — sem bibliotecas */
  function canvasParaPDF(canvas) {
    const jpeg = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
    const bin = atob(jpeg), len = bin.length, W = canvas.width, H = canvas.height;
    let pdf = "%PDF-1.3\n"; const off = [];
    const add = (s) => { off.push(pdf.length); pdf += s; };
    add("1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n");
    add("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");
    add(`3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>\nendobj\n`);
    add(`4 0 obj\n<</Type/XObject/Subtype/Image/Width ${W}/Height ${H}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${len}>>\nstream\n` + bin + "\nendstream\nendobj\n");
    const cont = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    add(`5 0 obj\n<</Length ${cont.length}>>\nstream\n${cont}\nendstream\nendobj\n`);
    const xrefPos = pdf.length;
    let xref = "xref\n0 6\n0000000000 65535 f \n";
    off.forEach((o) => { xref += String(o).padStart(10, "0") + " 00000 n \n"; });
    pdf += xref + `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`;
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: "application/pdf" });
  }

  function baixarArquivo(href, nome, revogar) {
    const link = document.createElement("a");
    link.download = nome; link.href = href; link.click();
    if (revogar) setTimeout(() => URL.revokeObjectURL(href), 4000);
  }

  const certBaixarBtn = document.getElementById("certBaixarBtn");
  if (certBaixarBtn) {
    certBaixarBtn.addEventListener("click", () => {
      desenharCertificado((c) => {
        baixarArquivo(c.toDataURL("image/png"), "certificado-aprende-ai.png");
        avisar("🏆 Certificado (imagem) baixado!");
      });
    });
  }

  const certPdfBtn = document.getElementById("certPdfBtn");
  if (certPdfBtn) {
    certPdfBtn.addEventListener("click", () => {
      if (!estado.nome) {
        const nome = prompt("Antes de baixar, digite seu nome para o certificado:");
        if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); }
      }
      desenharCertificado((c) => {
        const url = URL.createObjectURL(canvasParaPDF(c));
        baixarArquivo(url, "certificado-aprende-ai.pdf", true);
        avisar("📄 Certificado em PDF baixado!");
      });
    });
  }

  /* ---------------- Atualização geral ---------------- */
  function atualizarTudo() {
    atualizarModulos();
    atualizarProgresso();
    atualizarCertificado();
  }

  /* ============================================================
     MISSÕES PRÁTICAS — aprender FAZENDO no Claude de verdade
     ============================================================ */
  const MISSOES_PRATICAS = {
    "m1-1": [
      "Abra o claude.ai (ou o app) e mande sua primeira mensagem: \"o que você consegue fazer por alguém da minha profissão?\"",
      "Peça: \"me dê 3 exemplos práticos de como você pode me ajudar HOJE\" — e teste um deles.",
    ],
    "m1-2": [
      "Baixe o app Claude no celular e entre com sua conta.",
      "Abra o claude.ai no computador também e veja a mesma conversa nos dois lugares.",
    ],
    "m1-3": [
      "Tire uma foto de qualquer documento ou anotação e peça: \"explica isso em linguagem simples\".",
      "Toque no microfone e faça uma pergunta FALANDO, sem digitar nada.",
      "Ligue o pensamento estendido e peça para resolver um problema de lógica ou cálculo.",
    ],
    "m1-4": [
      "Troque o modelo no seletor e faça a MESMA pergunta para dois modelos diferentes. Compare a resposta.",
    ],
    "m1-5": [
      "Pegue um pedido que você faria \"de qualquer jeito\" e reescreva usando as 4 regras. Compare o antes e o depois.",
    ],
    "m2-1": [
      "Crie um Projeto chamado \"Meu trabalho\" com 3 linhas de instruções sobre quem você é e o que precisa.",
      "Suba 1 arquivo do seu trabalho no Projeto e faça uma pergunta sobre ele.",
    ],
    "m2-2": [
      "Peça: \"crie uma calculadora interativa de [algo útil pra você]\" e veja o Artifact nascer.",
      "Peça uma mudança no que ele criou (\"muda a cor\", \"adiciona um campo\") e veja atualizar.",
    ],
    "m2-3": [
      "Abra Configurações → Conectores e veja o diretório. Conecte o que você usa (ex.: Google Drive).",
      "Com um conector ativo, peça algo real: \"busca no meu Drive o arquivo X e resume\".",
    ],
    "m2-4": [
      "Ative a pesquisa na web e pergunte sobre algo desta semana. Confira as fontes citadas.",
      "Envie uma planilha ou PDF do seu trabalho e peça: \"3 conclusões e 1 alerta sobre este arquivo\".",
    ],
    "m2-5": [
      "Copie um dos prompts da sua área (acima) e use AGORA no Claude, adaptando os [colchetes].",
    ],
    "m2-6": [
      "Use a técnica da persona num pedido real: \"Você é um [especialista]. Analise...\".",
      "Peça crítica: \"aponte 3 fraquezas desta resposta e melhore-a\".",
    ],
    "m3-1": [
      "Instale o Node.js (nodejs.org) e rode no terminal: npm install -g @anthropic-ai/claude-code",
      "Entre numa pasta e digite \"claude\". Pergunte: \"o que tem nesta pasta?\"",
      "Peça uma automação de verdade: \"organize os arquivos desta pasta por tipo e me mostre o plano antes\".",
    ],
    "m3-2": [
      "Crie sua conta de desenvolvedor em platform.claude.com e explore o console (não precisa pagar nada para olhar).",
    ],
    "m3-3": [
      "No Claude Code, rode: claude mcp list — e veja seus servidores configurados.",
    ],
    "m3-4": [
      "Pergunte ao Claude: \"quais 3 tarefas do meu trabalho dá para automatizar? monte o passo a passo da mais fácil\" — e execute o passo 1.",
    ],
    "m3-5": [
      "Defina sua regra pessoal de segurança: escreva o que você NUNCA vai enviar para uma IA.",
    ],
  };

  function injetarMissoes() {
    Object.keys(MISSOES_PRATICAS).forEach((mod) => {
      const secao = document.querySelector(`[data-modulo="${mod}"]`);
      if (!secao) return;
      const btn = secao.querySelector(".btn-concluir");
      if (!btn) return;
      const bloco = document.createElement("div");
      bloco.className = "missoes";
      bloco.innerHTML =
        `<span class="missoes-titulo">🔥 Missões práticas — faça no Claude agora:</span>` +
        MISSOES_PRATICAS[mod]
          .map((t, i) => {
            const id = `${mod}-x${i}`;
            const ok = estado.missoes[id] ? "checked" : "";
            return `<label class="missao"><input type="checkbox" data-missao="${id}" ${ok}><span>${t}</span></label>`;
          })
          .join("");
      secao.insertBefore(bloco, btn);
    });
  }

  function totalMissoes() {
    let total = 0, feitas = 0;
    Object.keys(MISSOES_PRATICAS).forEach((mod) => {
      MISSOES_PRATICAS[mod].forEach((_, i) => {
        total++;
        if (estado.missoes[`${mod}-x${i}`]) feitas++;
      });
    });
    return { total, feitas };
  }

  function atualizarMissoesChip() {
    const { total, feitas } = totalMissoes();
    document.querySelectorAll(".missoes-chip").forEach((el) => el.remove());
    document.querySelectorAll(".nivel-cabecalho .nivel-badge").forEach((badge) => {
      const tela = badge.closest("[data-tela]");
      if (!tela || !["n1", "n2", "n3"].includes(tela.dataset.tela)) return;
      const chip = document.createElement("span");
      chip.className = "missoes-chip";
      chip.textContent = ` · 🔥 ${feitas}/${total} missões no total`;
      badge.appendChild(chip);
    });
  }

  document.addEventListener("change", (ev) => {
    const cb = ev.target.closest("[data-missao]");
    if (!cb) return;
    estado.missoes[cb.dataset.missao] = cb.checked;
    salvar();
    atualizarMissoesChip();
    if (cb.checked) avisar("🔥 Missão cumprida! É assim que se aprende.");
  });

  injetarMissoes();
  atualizarMissoesChip();

  /* ============================================================
     MEU CURSO — gerador de plano personalizado
     ============================================================ */
  const TAREFA_NOME = {
    emails: "e-mails", planilhas: "planilhas", relatorios: "relatórios",
    reunioes: "reuniões", apresentacoes: "apresentações", vendas: "vendas e visitas",
    equipe: "gestão de equipe", atendimento: "atendimento", documentos: "documentos e contratos",
    social: "redes sociais",
  };

  const PROMPTS_TAREFA = {
    emails: ["Responder e-mails em segundos", "Você é meu assistente de e-mails. Sou {CARGO}{EMPRESA}. Vou colar um e-mail recebido; escreva uma resposta profissional, cordial e pronta para enviar, com no máximo 8 linhas. E-mail: [cole aqui]"],
    planilhas: ["Analisar planilhas na hora", "Sou {CARGO}{EMPRESA}. Vou enviar uma planilha. Analise e me entregue: as 3 conclusões mais importantes, qualquer inconsistência nos dados e qual gráfico eu deveria montar para apresentar à diretoria."],
    relatorios: ["Relatório pronto em minutos", "Sou {CARGO}{EMPRESA}. Monte a estrutura do meu relatório de [período/assunto]: seções, o que escrever em cada uma e os indicadores que não podem faltar. Depois vamos preencher seção por seção."],
    reunioes: ["Atas e follow-ups automáticos", "Vou colar minhas anotações de reunião. Transforme em ata profissional (decisões, pendências, responsáveis, prazos) e rascunhe o e-mail de follow-up para os participantes. Anotações: [cole aqui]"],
    apresentacoes: ["Apresentações que impressionam", "Sou {CARGO}{EMPRESA} e preciso apresentar [tema] para [público]. Monte slide a slide: título, 3 bullets e sugestão visual. Máximo 10 slides, tom executivo."],
    vendas: ["Preparar visitas e clientes", "Sou {CARGO}{EMPRESA}. Pesquise na web o cliente [nome] e me dê: o que fazem, notícias recentes, possíveis necessidades e 3 ganchos de conversa para minha visita."],
    equipe: ["Liderar com método", "Sou {CARGO}{EMPRESA}. Me ajude a preparar uma conversa de feedback com um membro da equipe sobre [situação]: estrutura da conversa, frases para abrir bem e como fechar com plano de ação."],
    atendimento: ["Atendimento padronizado", "Sou {CARGO}{EMPRESA}. Crie respostas-modelo para as 6 perguntas mais comuns dos meus clientes sobre [produto/serviço], em tom simpático e profissional."],
    documentos: ["Documentos sem dor de cabeça", "Sou {CARGO}{EMPRESA}. Vou enviar um documento/contrato. Resuma destacando: partes, obrigações, prazos, valores e cláusulas que merecem atenção — em linguagem simples."],
    social: ["Conteúdo para redes", "Sou {CARGO}{EMPRESA}. Crie um calendário de 2 semanas de posts sobre [tema], com legenda pronta e ideia visual para cada um."],
  };

  const AUTOMACOES_TAREFA = {
    planilhas: "Consolidar várias planilhas (regionais, filiais, meses) em um resumo único — o Claude Code lê todas de uma pasta e gera o consolidado com gráficos.",
    relatorios: "Relatório semanal automático: você joga os arquivos numa pasta, roda um comando e o relatório sai pronto no seu modelo.",
    emails: "Rascunhos em lote: gerar respostas-padrão personalizadas para uma lista de contatos a partir de uma planilha.",
    documentos: "Organizar e renomear centenas de arquivos por data/cliente/assunto em segundos.",
    vendas: "Comparativo metas x realizado por região, gerado automaticamente a partir das suas planilhas de vendas.",
    reunioes: "Banco de atas pesquisável: todas as suas atas numa pasta e o Claude responde \"o que decidimos sobre X em março?\".",
    apresentacoes: "Gerar a base da apresentação mensal automaticamente a partir do relatório do período.",
    equipe: "Acompanhamento de time: consolidar apontamentos da equipe numa visão única semanal.",
    atendimento: "Classificar mensagens de clientes por assunto e urgência automaticamente.",
    social: "Gerar variações de posts para o mês inteiro a partir de uma lista de temas.",
  };

  const API_IA = "https://painel-melitta.vercel.app/api/chat";

  function lerPerfilDoForm() {
    const tarefas = Array.from(document.querySelectorAll("#perfTarefas .chip.ativo"))
      .map((c) => c.dataset.valor);
    return {
      nome: document.getElementById("perfNome").value.trim(),
      cargo: document.getElementById("perfCargo").value.trim(),
      empresa: document.getElementById("perfEmpresa").value.trim(),
      tarefas,
      ferramentas: document.getElementById("perfFerramentas").value.trim(),
      nivel: document.getElementById("perfNivel").value,
      objetivo: document.getElementById("perfObjetivo").value,
    };
  }

  function preencherForm(p) {
    document.getElementById("perfNome").value = p.nome || "";
    document.getElementById("perfCargo").value = p.cargo || "";
    document.getElementById("perfEmpresa").value = p.empresa || "";
    document.getElementById("perfFerramentas").value = p.ferramentas || "";
    document.getElementById("perfNivel").value = p.nivel || "pouco";
    document.getElementById("perfObjetivo").value = p.objetivo || "automatizar";
    document.querySelectorAll("#perfTarefas .chip").forEach((c) =>
      c.classList.toggle("ativo", (p.tarefas || []).includes(c.dataset.valor))
    );
  }

  function montarTutorPrompt(p) {
    const tarefas = p.tarefas.map((t) => TAREFA_NOME[t]).join(", ") || "tarefas variadas de escritório";
    const nivelTxt = { nunca: "nunca usei IA", pouco: "já usei um pouco", bastante: "uso bastante" }[p.nivel];
    const objTxt = {
      tempo: "ganhar tempo no dia a dia", automatizar: "automatizar tarefas repetidas",
      code: "aprender Claude Code para automatizar meu trabalho", conteudo: "criar conteúdo melhor",
      organizar: "organizar meu trabalho",
    }[p.objetivo];
    return (
      `Você é meu professor particular de Claude e consultor de produtividade. ` +
      `Meu nome é ${p.nome || "[seu nome]"} e trabalho como ${p.cargo}${p.empresa ? " na " + p.empresa : ""}. ` +
      `As tarefas que mais tomam meu tempo: ${tarefas}. ` +
      (p.ferramentas ? `Ferramentas que uso: ${p.ferramentas}. ` : "") +
      `Meu nível com IA: ${nivelTxt}. Meu objetivo: ${objTxt}.\n\n` +
      `Sua missão:\n` +
      `1. Me ensinar a usar o Claude na prática, UMA aula curta por vez, sempre com exercício real do MEU trabalho.\n` +
      `2. Sempre que eu descrever uma tarefa, me mostrar o jeito mais rápido de fazê-la com você.\n` +
      `3. Me sugerir automações possíveis (inclusive com Claude Code) e me guiar passo a passo, sem jargão técnico.\n` +
      `4. Ao final de cada aula, me dar UMA missão prática curta e perguntar se quero a próxima aula.\n\n` +
      `Comece agora com a Aula 1: me faça 3 perguntas rápidas para avaliar o que eu já sei.`
    );
  }

  function esc(t) { return t.replace(/"/g, "&quot;"); }

  function geraPlano(p) {
    const cargoTxt = p.cargo || "profissional";
    const empTxt = p.empresa ? ` na ${p.empresa}` : "";
    const focoAuto = p.objetivo === "automatizar" || p.objetivo === "code";
    const t1 = p.tarefas[0] ? TAREFA_NOME[p.tarefas[0]] : "uma tarefa sua";

    const prompts = p.tarefas.slice(0, 6).map((t) => {
      const [titulo, modelo] = PROMPTS_TAREFA[t];
      const texto = modelo.replace("{CARGO}", cargoTxt).replace("{EMPRESA}", empTxt);
      return `<div class="prompt-card"><div class="prompt-card-topo"><h5>${titulo}</h5><span class="prompt-card-cat">sob medida</span></div><p class="prompt-card-texto">${texto}</p><button class="btn-copiar" data-copiar="${esc(texto)}">📋 copiar</button></div>`;
    }).join("");

    const autos = p.tarefas.filter((t) => AUTOMACOES_TAREFA[t]).slice(0, 5)
      .map((t) => `<li><strong>${TAREFA_NOME[t].charAt(0).toUpperCase() + TAREFA_NOME[t].slice(1)}:</strong> ${AUTOMACOES_TAREFA[t]}</li>`).join("");

    const dias = [
      ["Dia 1 — Primeiros passos", `Crie a conta no claude.ai e no app do celular. Pergunte: "o que você consegue fazer por um(a) ${cargoTxt}?". Tire foto de um documento do trabalho e peça um resumo.`],
      ["Dia 2 — Prompts de gente grande", `Aplique as 4 regras (contexto, formato, porquê, iterar) num pedido real de ${t1}. Use um dos prompts sob medida abaixo.`],
      ["Dia 3 — Seu Projeto", `Crie o Projeto "${p.empresa || "Meu trabalho"} — ${cargoTxt}" com instruções fixas sobre você. Suba 2 arquivos que você sempre consulta.`],
      ["Dia 4 — Arquivos e Artifacts", `Envie uma planilha ou relatório de verdade e peça 3 conclusões + 1 alerta. Depois peça um Artifact útil (calculadora, painel, formulário).`],
      ["Dia 5 — Conectores", `Configurações → Conectores: conecte Google Drive/Gmail. Peça: "resume o documento X do meu Drive" ou "o que tenho na agenda amanhã?".`],
      focoAuto
        ? ["Dia 6 — Automação com Claude Code", `Instale o Node.js e o Claude Code (Nível 3, etapa 1). Rode "claude" numa pasta de trabalho e peça: "organize estes arquivos e me diga o que dá para automatizar aqui".`]
        : ["Dia 6 — Pesquisa profunda e memória", `Use a pesquisa na web para investigar um tema do seu mercado e peça um mini-relatório com fontes.`],
      ["Dia 7 — Projeto final", `Junte tudo: monte o "assistente definitivo" no seu Projeto — instruções completas + arquivos + 3 prompts salvos. Cole também o Professor Particular abaixo. 🎓`],
    ].map(([t, d]) => `<div class="plano-dia"><strong>${t}</strong><p>${d}</p></div>`).join("");

    const tutor = montarTutorPrompt(p);

    return `
      <div class="modulo plano-pronto">
        <div class="modulo-cabecalho"><span class="modulo-numero">Curso personalizado</span>
        <h3>${p.nome ? p.nome + ", aqui" : "Aqui"} está seu plano, ${cargoTxt}${empTxt}! 🎯</h3></div>

        <article class="licao"><h4>📅 Seu plano de 7 dias (15 min por dia)</h4>${dias}</article>

        ${prompts ? `<article class="licao"><h4>✂️ Prompts sob medida para o seu dia a dia</h4><div class="prompts-grade">${prompts}</div></article>` : ""}

        ${autos ? `<article class="licao"><h4>🤖 O que dá para AUTOMATIZAR no seu trabalho</h4>
          <p>Com o <strong>Claude Code</strong> (Nível 3), estas tarefas suas podem virar um comando só:</p>
          <ul class="lista-cartoes">${autos}</ul>
          <div class="destaque">💡 Comece pela mais simples. No Nível 3, etapa 1, você instala o Claude Code e pede exatamente isso para ele.</div></article>` : ""}

        <article class="licao"><h4>🎓 Seu Professor Particular (cole isto no Claude!)</h4>
          <p>Este é o segredo do curso: cole o texto abaixo numa conversa nova no Claude e ele vira o seu instrutor pessoal, com aulas feitas para o SEU trabalho.</p>
          <p class="prompt-card-texto" style="white-space:pre-wrap">${tutor}</p>
          <button class="btn btn-primario" data-copiar="${esc(tutor)}">📋 Copiar Professor Particular</button>
        </article>

        <article class="licao">
          <h4>✨ Versão turbinada com IA</h4>
          <p>Se a IA do site estiver ativa, posso gerar um plano ainda mais detalhado e exclusivo para você:</p>
          <button class="btn btn-fantasma" id="btnTurbinarIA">✨ Gerar com IA agora</button>
          <div class="ia-saida oculto" id="iaSaida"></div>
        </article>
      </div>`;
  }

  const formPerfil = document.getElementById("formPerfil");
  const planoResultado = document.getElementById("planoResultado");

  if (formPerfil) {
    // chips de tarefas
    document.querySelectorAll("#perfTarefas .chip").forEach((c) =>
      c.addEventListener("click", () => c.classList.toggle("ativo"))
    );

    // preset do tio 😄
    document.getElementById("presetMelitta").addEventListener("click", () => {
      preencherForm({
        nome: "", cargo: "Gerente Divisional", empresa: "Melitta",
        tarefas: ["relatorios", "planilhas", "emails", "reunioes", "apresentacoes", "vendas", "equipe"],
        ferramentas: "Excel, Outlook, PowerPoint, WhatsApp",
        nivel: "nunca", objetivo: "automatizar",
      });
      avisar("⭐ Exemplo carregado! Ajuste o que quiser e toque em Montar.");
    });

    formPerfil.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const p = lerPerfilDoForm();
      if (!p.cargo) { avisar("Preencha pelo menos o cargo/função 😉"); return; }
      estado.perfil = p;
      if (p.nome && !estado.nome) estado.nome = p.nome;
      salvar();
      planoResultado.innerHTML = geraPlano(p);
      saudacao();
      planoResultado.scrollIntoView({ behavior: "smooth", block: "start" });
      festejar();
    });

    // restaura perfil salvo
    if (estado.perfil) {
      preencherForm(estado.perfil);
      planoResultado.innerHTML = geraPlano(estado.perfil);
    }

    // modo IA (usa a função /api/chat do seu painel na Vercel, com a chave segura no servidor)
    planoResultado.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("#btnTurbinarIA");
      if (!btn || !estado.perfil) return;
      const saida = document.getElementById("iaSaida");
      saida.classList.remove("oculto");
      saida.textContent = "✨ Gerando seu plano com IA...";
      btn.disabled = true;
      try {
        const p = estado.perfil;
        const pedido =
          `Monte um mini-curso personalizado de Claude (a IA da Anthropic) para esta pessoa: ` +
          `cargo: ${p.cargo}; empresa: ${p.empresa || "não informada"}; ` +
          `tarefas que mais tomam tempo: ${p.tarefas.map((t) => TAREFA_NOME[t]).join(", ") || "variadas"}; ` +
          `ferramentas: ${p.ferramentas || "não informadas"}; nível com IA: ${p.nivel}; objetivo: ${p.objetivo}. ` +
          `Responda em português, direto ao ponto, com: 1) os 5 maiores ganhos de tempo para essa pessoa com o Claude; ` +
          `2) um exercício prático para fazer agora; 3) duas automações que valem a pena com Claude Code, explicadas sem jargão; ` +
          `4) um conselho final motivador. Máximo 400 palavras.`;
        const resp = await fetch(API_IA, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: pedido }] }),
        });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        saida.textContent = "";
        const leitor = resp.body.getReader();
        const dec = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await leitor.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const linhas = buffer.split("\n");
          buffer = linhas.pop();
          for (const linha of linhas) {
            if (!linha.startsWith("data: ")) continue;
            try {
              const ev2 = JSON.parse(linha.slice(6));
              if (ev2.type === "content_block_delta" && ev2.delta && ev2.delta.type === "text_delta") {
                saida.textContent += ev2.delta.text;
              }
            } catch (e) { /* linha incompleta */ }
          }
        }
        if (!saida.textContent.trim()) throw new Error("vazio");
      } catch (e) {
        saida.textContent =
          "⚠️ A IA do site ainda não está liberada (o servidor na Vercel está com login obrigatório). " +
          "Sem problema: o plano acima já é completo — e o Professor Particular faz a mesma coisa dentro do próprio Claude!";
      } finally {
        btn.disabled = false;
      }
    });
  }

  function saudacao() {
    const h1 = document.querySelector(".hero h1");
    if (h1 && estado.perfil && estado.perfil.nome) {
      h1.innerHTML = `Bora, <em>${estado.perfil.nome}</em>? Domine o Claude de verdade`;
    }
  }
  saudacao();

  /* ============================================================
     TUTOR IA — chat com base de conhecimento completa sobre o Claude
     Modo local (grátis, instantâneo) + upgrade automático para o
     Claude real via /api/chat quando o servidor estiver liberado.
     ============================================================ */
  const KB = [
    { k: ["o que e claude", "que e o claude", "claude e o que", "para que serve o claude"], t: "O que é o Claude",
      a: "O Claude é a inteligência artificial da Anthropic. Você conversa com ele em linguagem natural e ele escreve textos, resume e analisa documentos, lê imagens e PDFs, programa, pesquisa na web, cria planilhas e apresentações e muito mais. Funciona no site claude.ai, nos apps de celular e desktop, no Claude Code (terminal) e pela API." },
    { k: ["anthropic", "quem criou", "quem fez o claude", "empresa"], t: "Anthropic",
      a: "A Anthropic é a empresa americana que criou o Claude, fundada em 2021 por ex-pesquisadores de IA com foco em segurança. É uma das líderes mundiais em IA e criou também o padrão MCP, que conecta IAs a outras ferramentas." },
    { k: ["token", "tokens"], t: "Tokens",
      a: "Token é o 'pedacinho' de texto que a IA lê e escreve — uma palavra tem em média 1 a 3 tokens. No claude.ai você não se preocupa com isso (paga assinatura). Na API, o preço é por milhão de tokens: por exemplo, o Sonnet 4.6 custa US$ 3 por milhão na entrada e US$ 15 na saída." },
    { k: ["janela de contexto", "contexto", "memoria de trabalho", "quanto texto"], t: "Janela de contexto",
      a: "É a 'memória de trabalho' do modelo: quanto texto ele considera de uma vez na conversa. Sonnet, Opus e Fable trabalham com até 1 milhão de tokens (cabem livros inteiros!); o Haiku, com 200 mil. Se a conversa ficar gigante, o Claude resume automaticamente as partes antigas." },
    { k: ["modelos", "qual modelo", "diferenca entre os modelos", "que modelo usar", "escolher modelo"], t: "Os modelos",
      a: "São 4 principais: ⚡ Haiku 4.5 (rápido e barato — tarefas simples em volume), ⚖️ Sonnet 4.6 (equilibrado — o melhor para o dia a dia), 🎻 Opus 4.8 (especialista — trabalhos longos e complexos) e 🌟 Fable 5 (topo de linha — os problemas mais difíceis). Regra de bolso: comece pelo Sonnet; desça pro Haiku se for simples, suba pro Opus se for complexo." },
    { k: ["haiku"], t: "Haiku 4.5",
      a: "O Haiku 4.5 é o modelo mais rápido e barato da família (US$ 1 entrada / US$ 5 saída por milhão de tokens na API, contexto de 200 mil tokens). Ideal para tarefas simples e repetitivas em grande volume: classificar mensagens, respostas rápidas de atendimento, resumos curtos." },
    { k: ["sonnet"], t: "Sonnet 4.6",
      a: "O Sonnet 4.6 é o equilibrado — a melhor combinação de velocidade e inteligência. Perfeito para o dia a dia: escrever e revisar textos, programar, analisar documentos e planilhas. Contexto de 1 milhão de tokens; na API custa US$ 3 (entrada) / US$ 15 (saída) por milhão." },
    { k: ["opus"], t: "Opus 4.8",
      a: "O Opus 4.8 é o especialista autônomo: encara trabalhos longos e difíceis — refatorar projetos inteiros de código, pesquisas profundas, relatórios elaborados, agentes que trabalham horas sem supervisão. Contexto de 1 milhão; na API custa US$ 5 / US$ 25 por milhão de tokens." },
    { k: ["fable", "mythos", "claude 5", "modelo mais forte", "mais inteligente", "topo de linha"], t: "Fable 5",
      a: "O Fable 5 é o modelo mais capaz disponível — o primeiro da família Claude 5, da nova classe 'Mythos'. É chamado quando nem o Opus dá conta: raciocínio extremo e projetos autônomos longuíssimos. O raciocínio interno dele fica sempre ativo. Na API custa US$ 10 / US$ 50 por milhão de tokens." },
    { k: ["preco", "precos", "quanto custa", "valor", "caro"], t: "Preços",
      a: "Depende de onde você usa! No claude.ai: plano Free (grátis, com limites), Pro (assinatura mensal, uso ampliado), Max (5x ou 20x o Pro) e Team/Enterprise para empresas — confira valores atuais na página de planos do claude.ai. Na API (para desenvolvedores) paga-se por milhão de tokens: Haiku US$ 1/5, Sonnet US$ 3/15, Opus US$ 5/25, Fable US$ 10/50 (entrada/saída)." },
    { k: ["plano free", "gratis", "gratuito", "de graca", "sem pagar"], t: "Plano grátis",
      a: "Sim, dá para usar o Claude de graça! Crie a conta no claude.ai ou no app e use o plano Free — ele tem limite de mensagens que renova com o tempo e acesso aos recursos básicos. Para uso diário intenso, Projetos e conectores, o plano Pro vale a pena." },
    { k: ["plano pro", "assinatura", "plano max", "team", "enterprise", "planos"], t: "Planos do claude.ai",
      a: "Free: grátis, com limites — bom para conhecer. Pro: assinatura mensal com muito mais uso, mais modelos, Projetos e conectores. Max: para uso intenso, com faixas de 5x e 20x o limite do Pro. Team e Enterprise: para empresas, com gestão de equipe e controles administrativos. Os valores estão na página de planos do claude.ai." },
    { k: ["criar conta", "cadastro", "como comecar", "primeiro acesso", "registrar"], t: "Criar conta",
      a: "1) Acesse claude.ai no navegador ou baixe o app 'Claude' na App Store / Google Play. 2) Entre com seu e-mail ou conta Google. 3) Pronto — a tela principal é um chat: digite qualquer coisa e converse. Dica: comece pedindo 'o que você pode fazer por alguém da minha profissão?'" },
    { k: ["aplicativo", "app", "celular", "baixar", "desktop", "computador", "instalar o claude"], t: "Apps do Claude",
      a: "O Claude tem: site (claude.ai), app de celular (iPhone e Android — busque 'Claude' na loja), e app de desktop para Mac e Windows (baixe em claude.ai/download). Tudo sincronizado: a conversa que você começa no celular continua no computador." },
    { k: ["nova conversa", "historico", "conversas antigas", "apagar conversa", "renomear"], t: "Conversas e histórico",
      a: "O botão + cria uma conversa nova — use uma conversa por assunto, isso melhora muito as respostas. No menu lateral fica o histórico: dá para buscar, renomear, continuar de onde parou e apagar conversas. Hábito de ouro: assunto novo = conversa nova." },
    { k: ["seletor de modelo", "trocar modelo", "mudar modelo", "escolher o modelo na tela"], t: "Trocar de modelo",
      a: "Perto do campo de digitação há um seletor com o nome do modelo (ex.: 'Sonnet 4.6'). Toque nele para trocar entre Haiku, Sonnet, Opus etc. — alguns modelos dependem do seu plano. Teste a mesma pergunta em dois modelos para sentir a diferença!" },
    { k: ["pensamento estendido", "modo de raciocinio", "thinking", "pensar mais", "raciocinio"], t: "Pensamento estendido",
      a: "É uma chave/botão perto do campo de texto que deixa o Claude 'pensar' por mais tempo antes de responder. Ligue para problemas difíceis: matemática, lógica, análise profunda, decisões importantes. Desligado, ele responde mais rápido — melhor para perguntas simples." },
    { k: ["anexar", "enviar arquivo", "mandar foto", "pdf", "imagem", "planilha", "excel", "documento", "clipe"], t: "Anexar arquivos e fotos",
      a: "Toque no clipe 📎 (ou no + no celular) para enviar PDFs, fotos, planilhas, Word e outros arquivos. O Claude lê e analisa: 'resume este contrato', 'acha erros nesta planilha', 'transcreve esta foto'. Ele também CRIA arquivos: peça uma planilha ou apresentação e baixe o resultado." },
    { k: ["pesquisa na web", "internet", "buscar na web", "noticias", "atualizado", "cotacao"], t: "Pesquisa na web",
      a: "Ative a busca na web no menu de ferramentas da conversa e o Claude pesquisa informação atual na internet, citando as fontes. Essencial para preços, notícias e qualquer coisa recente — o conhecimento 'de fábrica' do modelo tem data de corte." },
    { k: ["pesquisa profunda", "deep research", "pesquisa avancada", "relatorio com fontes"], t: "Pesquisa profunda",
      a: "É o modo de pesquisa avançada: o Claude investiga um tema a fundo por vários minutos, cruzando dezenas de fontes, e devolve um relatório organizado com referências. Ótimo para estudo de mercado, comparar produtos ou se aprofundar num assunto. Disponível nos planos pagos." },
    { k: ["voz", "falar", "ditado", "microfone", "audio"], t: "Voz e ditado",
      a: "No app do celular, toque no microfone para ditar em vez de digitar — ou use o modo de voz para conversar falando e ouvindo, como uma ligação. Perfeito para usar andando, dirigindo ou quando der preguiça de digitar. 😄" },
    { k: ["estilos", "tom de resposta", "jeito de escrever", "formal", "estilo de resposta"], t: "Estilos de resposta",
      a: "Nas configurações (e no menu da conversa) você escolhe o estilo de escrita do Claude: mais formal, mais direto, mais explicativo — e dá para criar estilos personalizados com exemplos do seu jeito de escrever. Bom para padronizar e-mails e textos da empresa." },
    { k: ["memoria", "lembrar", "ele lembra", "esquecer", "apagar memoria"], t: "Memória",
      a: "O Claude pode lembrar informações suas entre conversas: nome, empresa, preferências, contexto de projetos. Você controla tudo: nas configurações dá para ver o que ele memorizou, editar e apagar. A memória deixa as respostas cada vez mais 'a sua cara'." },
    { k: ["projeto", "projetos", "pasta inteligente", "instrucoes fixas", "base de conhecimento"], t: "Projetos",
      a: "Projeto é uma 'pasta inteligente': agrupa conversas de um mesmo assunto e dá ao Claude instruções fixas + arquivos de referência permanentes. Como criar: menu lateral → Projetos → Novo projeto → escreva as instruções (quem é você, o que quer, regras) → suba arquivos (catálogo, tabela, modelos). Toda conversa dentro dele já 'nasce sabendo' tudo isso." },
    { k: ["artifact", "artefato", "criar site", "criar app", "calculadora", "painel ao lado"], t: "Artifacts",
      a: "Quando você pede algo que é um 'produto' (documento, site, mini-app, diagrama, planilha), o Claude abre um painel chamado Artifact ao lado do chat com o resultado pronto e editável. Peça mudanças ('muda a cor', 'adiciona um campo') e veja atualizar. Dá até para publicar e compartilhar o link. Teste: 'crie uma calculadora de gorjeta interativa'." },
    { k: ["conector", "conectores", "connectors", "ligar ferramentas", "integracao"], t: "Conectores",
      a: "Conectores ligam o Claude às suas ferramentas reais: Google Drive, Gmail, Agenda, Notion, Slack, GitHub e dezenas de outras — sempre com sua permissão. Aí você pede coisas como 'resume o documento X do meu Drive' ou 'o que tenho na agenda amanhã?'. Para instalar: Configurações → Conectores → escolha no diretório → Conectar e autorize." },
    { k: ["instalar conector", "ativar conector", "como conecto", "google drive", "gmail", "agenda", "notion", "slack"], t: "Instalar um conector",
      a: "Passo a passo: 1) No claude.ai, abra Configurações → Conectores. 2) Procure a ferramenta no diretório (ex.: Google Drive). 3) Toque em Conectar e faça login na ferramenta para autorizar. 4) Na conversa, ative o conector no menu de ferramentas e peça normalmente. Você pode desconectar quando quiser." },
    { k: ["conector personalizado", "extensao", "extensoes", "adicionar url", "servidor proprio"], t: "Conectores personalizados",
      a: "Se uma ferramenta não está no diretório mas tem um servidor MCP, adicione pelo endereço: Configurações → Conectores → Adicionar conector personalizado → cole a URL. No app de desktop também existem extensões locais, que acessam coisas do seu computador (como pastas de arquivos). Só instale de fontes confiáveis!" },
    { k: ["mcp", "model context protocol", "usb das ias", "protocolo"], t: "MCP",
      a: "MCP (Model Context Protocol) é um padrão aberto criado pela Anthropic — pense no 'USB das IAs': um plugue universal que conecta qualquer ferramenta a qualquer assistente. Um servidor MCP expõe ferramentas (ações) e recursos (dados); o Claude é o cliente que os usa. É a tecnologia por trás dos conectores." },
    { k: ["servidor mcp", "criar mcp", "mcp add", "mcp list"], t: "Servidores MCP",
      a: "Servidor MCP é o programa que oferece ferramentas para a IA (ex.: o do GitHub expõe 'criar issue', 'ler pull request'). Pode ser remoto (conecta pela URL) ou local (roda no seu computador). No Claude Code: 'claude mcp add --transport http nome URL' para adicionar e 'claude mcp list' para listar. Quem programa pode criar o próprio servidor com os SDKs oficiais." },
    { k: ["claude code", "terminal", "linha de comando", "programar"], t: "Claude Code",
      a: "O Claude Code é o Claude rodando no seu computador (terminal, desktop, VS Code). A diferença para o chat: ele AGE — lê e edita arquivos, roda comandos, testa e corrige sozinho, sempre pedindo sua aprovação para ações importantes. Serve para criar sistemas, corrigir bugs e automatizar tarefas repetitivas (organizar arquivos, consolidar planilhas, gerar relatórios)." },
    { k: ["instalar claude code", "npm install", "node", "como instalo o code"], t: "Instalar o Claude Code",
      a: "1) Instale o Node.js (nodejs.org). 2) No terminal: npm install -g @anthropic-ai/claude-code. 3) Entre na pasta do projeto e digite 'claude'. 4) Faça login com sua conta (Pro/Max ou chave da API) e converse: 'o que tem nesta pasta?'. Dica: o comando /init cria o CLAUDE.md, o 'manual do projeto'." },
    { k: ["claude.md", "init", "comandos do claude code", "barra init"], t: "Comandos do Claude Code",
      a: "Os principais: /init cria o arquivo CLAUDE.md (manual do projeto que ele lê em toda sessão); 'claude mcp add/list' gerencia servidores MCP; e você conversa normalmente pedindo qualquer coisa ('corrige esse bug', 'organize esta pasta'). Ele sempre mostra o plano e pede aprovação antes de ações importantes." },
    { k: ["automatizar", "automacao", "tarefas repetitivas", "robotizar", "automatico"], t: "Automação",
      a: "Com o Claude Code dá para automatizar de verdade: consolidar várias planilhas em um resumo único, gerar o relatório semanal a partir de uma pasta de arquivos, renomear/organizar centenas de documentos, criar rascunhos de e-mail em lote, comparar metas x realizado... Comece assim: pergunte ao Claude 'quais tarefas do meu trabalho dá para automatizar?' e peça o passo a passo da mais fácil." },
    { k: ["api", "desenvolvedor", "integrar no sistema", "colocar no meu site"], t: "API",
      a: "A API é como desenvolvedores colocam o Claude dentro dos próprios sistemas (chatbot no site, classificador de e-mails, gerador de relatórios). Você cria conta no console (platform.claude.com), gera uma chave de API e paga por uso (por milhão de tokens). Tem recursos como execução de código, busca na web, visão e respostas em JSON." },
    { k: ["chave de api", "api key", "chave secreta", "sk-ant"], t: "Chave de API",
      a: "A chave de API (começa com sk-ant-...) é a 'senha' que identifica seu aplicativo na Anthropic. Regras de ouro: nunca coloque a chave dentro do código publicado, nunca compartilhe, use variáveis de ambiente ou cofres de senha. Quem tem sua chave gasta na SUA conta!" },
    { k: ["batch", "lote", "desconto", "50%", "mais barato"], t: "Batch API",
      a: "O Batch API processa tarefas sem pressa (até 24h) com 50% de desconto sobre o preço normal da API. Perfeito para volumes grandes que não precisam de resposta imediata: classificar milhares de textos, gerar resumos em massa, processar relatórios da madrugada." },
    { k: ["cache", "cache de prompt", "economizar na api"], t: "Cache de prompt",
      a: "O cache de prompt guarda a parte repetida das suas chamadas de API (instruções fixas, documentos grandes) e cobra até ~90% mais barato nas chamadas seguintes. Junto com o Batch (50% off), é a principal forma de economizar na API." },
    { k: ["agente", "agentes", "agentic", "funcionario digital"], t: "Agentes",
      a: "Agente é a IA que não só responde — executa um objetivo: planeja, usa ferramentas, verifica o resultado e tenta de novo até concluir. Pense em 'funcionários digitais' para tarefas chatas: triagem de e-mails, monitoramento de planilhas, relatórios semanais. O Claude é referência mundial nisso." },
    { k: ["skill", "skills", "habilidade", "apostila"], t: "Skills",
      a: "Skills são 'apostilas' que ensinam o Claude a fazer uma tarefa do SEU jeito — por exemplo, o padrão de propostas da sua empresa. Você cria uma pasta com instruções e exemplos, e o Claude consulta quando a tarefa pede. Existem skills prontas (Excel, Word, PowerPoint, PDF) e personalizadas." },
    { k: ["subagente", "subagentes", "paralelo", "varios agentes"], t: "Subagentes",
      a: "Subagentes são 'ajudantes' que o Claude despacha em paralelo para dividir um trabalho grande: um pesquisa, outro escreve, outro revisa — tudo ao mesmo tempo. É como ter uma equipe inteira num comando só. Disponível no Claude Code e na API." },
    { k: ["seguranca", "lgpd", "dados", "privacidade", "senha", "confiavel", "seguro"], t: "Segurança",
      a: "Regras de ouro: 1) Senhas e chaves: NUNCA envie para nenhuma IA. 2) Dados de clientes: só conforme a política da empresa e a LGPD. 3) IA acelera, humano assina: revise documentos importantes. 4) Conectores: dê só as permissões necessárias e desconecte o que não usa. 5) Confira números e fatos importantes — IA pode errar." },
    { k: ["alucina", "alucinacao", "erra", "inventa", "confiar", "mentira"], t: "Alucinação",
      a: "Alucinação é quando a IA inventa uma informação com confiança — acontece com toda IA. Defesas: peça fontes ('cite as fontes'), use a pesquisa na web para fatos atuais, confira números importantes e desconfie de detalhes muito específicos (datas, valores, nomes) que você não consegue verificar." },
    { k: ["limite", "limites", "acabou as mensagens", "quota", "esgotou"], t: "Limites de uso",
      a: "Cada plano tem um limite de mensagens que renova com o tempo (no Free é menor; Pro e Max ampliam bastante). Conversas muito longas e arquivos grandes consomem mais. Dica: conversas novas por assunto gastam menos contexto e melhoram as respostas." },
    { k: ["portugues", "idioma", "ingles", "linguagem"], t: "Idiomas",
      a: "O Claude fala português brasileiro perfeitamente — pode conversar normalmente! Ele também traduz entre dezenas de idiomas: 'traduza este e-mail para o inglês formal' funciona na hora." },
    { k: ["chatgpt", "gpt", "gemini", "diferenca", "melhor que", "comparar ia"], t: "Claude x outras IAs",
      a: "O Claude se destaca em: textos longos e naturais, análise de documentos grandes (contexto de 1 milhão de tokens), programação (o Claude Code é referência), agentes que trabalham sozinhos e segurança. O ideal é testar com as SUAS tarefas — este curso te dá o método para extrair o máximo dele." },
    { k: ["prompt", "como pedir", "escrever melhor", "dicas de prompt", "persona", "exemplos"], t: "Bons prompts",
      a: "As 4 regras: 1) Dê contexto (quem, o quê, para quê). 2) Diga o formato (lista, tabela, nº de parágrafos). 3) Diga o porquê (a intenção melhora tudo). 4) Itere (peça ajustes na mesma conversa). Nível 2: defina uma persona ('você é um contador especialista...') e mostre exemplos do estilo que quer. Treine na Oficina de Prompts, na aba Jogos!" },
    { k: ["curso", "certificado", "como funciona o site", "academia", "progresso", "missoes"], t: "Sobre este curso",
      a: "A Academia Claude tem 3 níveis (Iniciante, Intermediário, Avançado), cada um com etapas, missões práticas 🔥 para fazer no Claude de verdade e um quiz (precisa de 70%). Completando tudo + o jogo Missão Certa, você libera o certificado para baixar. Na aba 🎯 Meu Curso, o site monta um plano personalizado para o seu trabalho. Seu progresso fica salvo no aparelho." },
    { k: ["jogo", "jogos", "missao certa", "oficina"], t: "Os jogos",
      a: "São dois: 🎮 Missão Certa — você é o gestor de IA e escolhe o modelo ideal para cada missão contra o tempo (50%+ conta para o certificado); e 🛠️ Oficina de Prompts — 8 rodadas para escolher a melhor versão de um prompt fraco (6 acertos = selo de Engenheiro de Prompts). Ambos na aba Jogos!" },
  ];

  const TUTOR_CEREBRO =
    "Você é o Tutor da Academia Claude, um professor particular especialista em TUDO sobre o Claude da Anthropic: " +
    "site claude.ai, apps (celular/desktop), planos (Free, Pro, Max, Team/Enterprise), todos os botões e funções da interface " +
    "(nova conversa, seletor de modelo, pensamento estendido, anexos, pesquisa na web, pesquisa profunda, voz, estilos, memória), " +
    "modelos (Haiku 4.5: rápido/barato, 200 mil de contexto, US$1/5 por milhão de tokens; Sonnet 4.6: equilibrado, 1 milhão, US$3/15; " +
    "Opus 4.8: especialista autônomo, 1 milhão, US$5/25; Fable 5: topo de linha da família Claude 5, 1 milhão, US$10/50), " +
    "Projetos, Artifacts, conectores e MCP (instalação em Configurações → Conectores), Claude Code (npm install -g @anthropic-ai/claude-code, " +
    "/init, CLAUDE.md, claude mcp add/list, automações), API (console platform.claude.com, chaves, Batch -50%, cache de prompt -90%), " +
    "agentes, skills, subagentes e segurança (LGPD, nunca enviar senhas, revisar conteúdo importante). " +
    "Regras: responda SEMPRE em português brasileiro, de forma curta, prática e didática (máximo ~150 palavras), com passos numerados quando for tutorial. " +
    "O aluno está fazendo o curso da Academia Claude (3 níveis + missões práticas + quiz + jogos + certificado). " +
    "Se a pergunta fugir do tema Claude/IA, redirecione gentilmente para o curso. Se não tiver certeza de um valor atual (preço, limite), diga que pode mudar e indique onde conferir.";

  const SUGESTOES_TUTOR = [
    "Qual a diferença entre os modelos?",
    "Como instalo um conector?",
    "O que é o Claude Code?",
    "Quanto custa o plano Pro?",
    "Como criar um Projeto?",
    "O que dá para automatizar?",
    "O que são Artifacts?",
    "O que é MCP?",
    "Como escrever bons prompts?",
    "O Claude pode errar?",
  ];

  const chatMensagens = document.getElementById("chatMensagens");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatSugestoes = document.getElementById("chatSugestoes");
  const tutorModo = document.getElementById("tutorModo");
  let modoClaude = null; // null = ainda não testou; true = API real; false = local
  let ultimoTema = null;

  function normalizar(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function buscarResposta(pergunta) {
    const p = " " + normalizar(pergunta) + " ";

    // conversa social básica
    if (/\b(oi|ola|opa|bom dia|boa tarde|boa noite|eai|e ai)\b/.test(p) && pergunta.length < 30)
      return "Oi! 👋 Sou o tutor da Academia Claude. Pergunta qualquer coisa sobre o Claude — botões, planos, modelos, conectores, Claude Code... Pode mandar!";
    if (/\b(obrigad|valeu|brigado|show|top|massa|perfeito)\b/.test(p) && pergunta.length < 40)
      return "De nada! 😊 Qualquer outra dúvida, é só perguntar. E não esquece das missões práticas 🔥 — fazer é o que ensina!";
    if (/quem (e|es) voce|o que voce faz|voce e quem/.test(p))
      return "Sou o tutor da Academia Claude! Conheço o Claude de ponta a ponta: cada botão, cada função, planos, modelos, conectores, Claude Code, API... Pergunte qualquer dúvida do curso ou do app.";

    let melhor = null, melhorPontos = 0;
    KB.forEach((item) => {
      let pontos = 0;
      item.k.forEach((kw) => {
        if (p.includes(normalizar(kw))) pontos += kw.split(" ").length * 2 + (kw.length > 8 ? 1 : 0);
      });
      if (pontos > melhorPontos) { melhorPontos = pontos; melhor = item; }
    });

    if (melhor && melhorPontos >= 2) {
      ultimoTema = melhor;
      return "💡 " + melhor.t + "\n\n" + melhor.a;
    }
    // contexto: pergunta curta de seguimento sobre o último tema
    if (ultimoTema && pergunta.length < 30 && /\b(e |isso|ele|ela|como assim|mais|exemplo)\b/.test(p)) {
      return "Sobre " + ultimoTema.t + ": " + ultimoTema.a;
    }
    return "Hmm, essa eu não tenho na ponta da língua no modo local. 🤔 Tente perguntar de outro jeito ou escolha um tema abaixo — sei tudo sobre: modelos e preços, planos, botões da tela, Projetos, Artifacts, conectores/MCP, Claude Code, API, agentes e segurança.";
  }

  function addBolha(de, texto, digitando) {
    const div = document.createElement("div");
    div.className = "msg " + (de === "eu" ? "msg-eu" : "msg-ia") + (digitando ? " digitando" : "");
    div.textContent = texto;
    chatMensagens.appendChild(div);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
    return div;
  }

  function salvarMsg(de, t) {
    estado.tutorHistorico.push({ de, t });
    if (estado.tutorHistorico.length > 60) estado.tutorHistorico = estado.tutorHistorico.slice(-60);
    salvar();
  }

  function renderSugestoes() {
    const escolhidas = embaralhar(SUGESTOES_TUTOR).slice(0, 4);
    chatSugestoes.innerHTML = escolhidas
      .map((s) => `<button type="button" class="chip" data-sugestao="${s}">${s}</button>`)
      .join("");
  }

  function atualizarModoBadge() {
    if (!tutorModo) return;
    tutorModo.textContent = modoClaude === true
      ? "✨ conectado ao Claude de verdade"
      : "🤖 respondendo na hora, grátis";
  }

  async function responderComClaude(pergunta, bolha) {
    const historico = estado.tutorHistorico.slice(-12).map((m) => ({
      role: m.de === "eu" ? "user" : "assistant",
      content: m.t,
    }));
    const msgs = [
      { role: "user", content: TUTOR_CEREBRO },
      { role: "assistant", content: "Entendido! Sou o tutor da Academia Claude. Pode perguntar." },
    ].concat(historico, [{ role: "user", content: pergunta }]);

    const ctrl = new AbortController();
    const tempo = setTimeout(() => ctrl.abort(), 15000);
    const resp = await fetch(API_IA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
      signal: ctrl.signal,
    });
    clearTimeout(tempo);
    if (!resp.ok) throw new Error("HTTP " + resp.status);

    bolha.classList.remove("digitando");
    bolha.textContent = "";
    const leitor = resp.body.getReader();
    const dec = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const linhas = buffer.split("\n");
      buffer = linhas.pop();
      for (const linha of linhas) {
        if (!linha.startsWith("data: ")) continue;
        try {
          const ev2 = JSON.parse(linha.slice(6));
          if (ev2.type === "content_block_delta" && ev2.delta && ev2.delta.type === "text_delta") {
            bolha.textContent += ev2.delta.text;
            chatMensagens.scrollTop = chatMensagens.scrollHeight;
          }
        } catch (e) { /* linha parcial */ }
      }
    }
    if (!bolha.textContent.trim()) throw new Error("vazio");
    return bolha.textContent;
  }

  async function enviarPergunta(pergunta) {
    addBolha("eu", pergunta);
    salvarMsg("eu", pergunta);
    chatInput.value = "";
    const bolha = addBolha("ia", "…", true);

    let resposta = null;
    if (modoClaude !== false) {
      try {
        resposta = await responderComClaude(pergunta, bolha);
        modoClaude = true;
      } catch (e) {
        modoClaude = false;
      }
      atualizarModoBadge();
    }
    if (resposta === null) {
      // modo local: resposta instantânea com pequena pausa natural
      resposta = buscarResposta(pergunta);
      await new Promise((r) => setTimeout(r, 350));
      bolha.classList.remove("digitando");
      bolha.textContent = resposta;
      chatMensagens.scrollTop = chatMensagens.scrollHeight;
    }
    salvarMsg("ia", resposta);
    renderSugestoes();
  }

  if (chatForm) {
    // restaura conversa salva ou dá boas-vindas
    if (estado.tutorHistorico.length) {
      estado.tutorHistorico.forEach((m) => addBolha(m.de, m.t));
    } else {
      const boasVindas =
        "Oi! 👋 Eu sou o tutor da Academia Claude. Pode me perguntar QUALQUER coisa sobre o Claude: " +
        "o que cada botão faz, planos e preços, modelos, Projetos, conectores, Claude Code, automação... " +
        "Toque numa sugestão abaixo ou escreva sua dúvida!";
      addBolha("ia", boasVindas);
      salvarMsg("ia", boasVindas);
    }
    renderSugestoes();
    atualizarModoBadge();

    chatForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const p = chatInput.value.trim();
      if (p) enviarPergunta(p);
    });

    chatSugestoes.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-sugestao]");
      if (b) enviarPergunta(b.dataset.sugestao);
    });

    document.getElementById("chatLimpar").addEventListener("click", () => {
      estado.tutorHistorico = [];
      salvar();
      chatMensagens.innerHTML = "";
      ultimoTema = null;
      const msg = "Conversa limpa! 🧹 Pode perguntar de novo o que quiser.";
      addBolha("ia", msg);
      salvarMsg("ia", msg);
    });
  }

  /* ============================================================
     OFICINA DE PROMPTS — jogo 2 (melhore o prompt fraco)
     ============================================================ */
  const OFICINA = [
    { c: "Você precisa cobrar um cliente sem estragar a relação.",
      f: "faz um email de cobrança",
      o: ["Escreva um e-mail educado cobrando a fatura vencida há 15 dias do cliente Silva, mantendo o bom relacionamento. Máximo 6 linhas.",
          "EMAIL DE COBRANÇA. URGENTE. AGORA.",
          "faz um email de cobrança bem feito por favor, obrigado"],
      r: 0, e: "Contexto (15 dias, cliente Silva), objetivo (manter a relação) e formato (6 linhas). Educação não substitui informação!" },
    { c: "Você quer um post para o Instagram da empresa.",
      f: "faz um post",
      o: ["faz um post legal para o instagram",
          "Crie 3 opções de legenda para Instagram sobre [produto], para um público jovem, tom divertido, com 1 emoji e chamada para ação no final.",
          "Você é o melhor marketeiro do mundo. Faça o melhor post já feito."],
      r: 1, e: "Pedir 3 opções te dá escolha; público, tom e formato definidos geram o post certo de primeira. Elogiar a IA não melhora nada. 😄" },
    { c: "Você recebeu uma planilha gigante de vendas para analisar.",
      f: "analisa essa planilha",
      o: ["analisa essa planilha aí completa",
          "me fala tudo sobre esses dados",
          "Analise esta planilha de vendas e me dê: as 3 conclusões mais importantes, qualquer número estranho e qual região precisa de atenção. Vou apresentar para a diretoria."],
      r: 2, e: "Dizer O QUE você quer da análise (3 conclusões, alertas) e PARA QUE (diretoria) transforma a resposta." },
    { c: "Você quer aprender um assunto difícil do zero.",
      f: "me explica física quântica",
      o: ["Me explique física quântica como se eu tivesse 12 anos, usando analogias do dia a dia. Depois me faça 3 perguntas para ver se entendi.",
          "me explica física quântica inteira agora",
          "física quântica. resumo. vai."],
      r: 0, e: "Definir o nível (12 anos), pedir analogias e um teste no final é o método do professor particular." },
    { c: "Você precisa preparar uma reunião importante amanhã.",
      f: "me ajuda com a reunião",
      o: ["me ajuda com uma reunião que tenho amanhã",
          "Tenho reunião amanhã com [cliente] sobre [assunto]. Monte: agenda de 30 min, 3 perguntas-chave para fazer e possíveis objeções com respostas.",
          "o que falar em reuniões?"],
      r: 1, e: "Contexto (quem, sobre o quê) + entregáveis claros (agenda, perguntas, objeções) = reunião preparada em 2 minutos." },
    { c: "A primeira resposta veio boa, mas longa demais.",
      f: "(você não gostou do tamanho)",
      o: ["refaz",
          "tá ruim",
          "Ficou ótimo, mas está longo. Reduza para 3 parágrafos mantendo os números e o tom."],
      r: 2, e: "Iterar com instrução específica (o que manter, o que mudar) aproveita a conversa. 'Refaz' joga fora o que estava bom." },
    { c: "Você quer ideias para o aniversário da sua mãe.",
      f: "ideias de presente",
      o: ["ideias de presente de aniversário",
          "Minha mãe faz 60 anos, adora jardinagem e café, orçamento de R$ 200. Me dê 5 ideias de presente criativas, da mais segura à mais ousada.",
          "o que dar de presente para mães?"],
      r: 1, e: "Detalhes pessoais (60 anos, jardinagem, café, orçamento) transformam ideias genéricas em ideias certeiras." },
    { c: "Você quer que o texto saia no estilo da sua empresa.",
      f: "escreve no nosso estilo",
      o: ["escreve do jeito que a gente escreve",
          "escreve formal mas nem tanto, sabe?",
          "Aqui estão 2 exemplos de textos nossos: [cola]. Escreva o novo comunicado seguindo exatamente este estilo e tom."],
      r: 2, e: "Mostrar exemplos reais é a forma mais poderosa de transferir estilo — vale mais que qualquer descrição." },
  ];

  const oficinaCaixa = document.getElementById("oficinaCaixa");
  if (oficinaCaixa) {
    let ofOrdem = [], ofAtual = 0, ofPontos = 0;

    function ofInicio() {
      const info = estado.oficina;
      oficinaCaixa.innerHTML = `
        <div class="quiz-inicio">
          <p>São <strong>${OFICINA.length} rodadas</strong>. Em cada uma: um prompt fraco e 3 versões — toque na melhor. Acerte <strong>6 ou mais</strong> para ganhar o selo de Engenheiro(a) de Prompts. 🛠️</p>
          <button class="btn btn-primario" data-of="comecar">Começar a oficina</button>
          ${info.melhor ? `<p class="quiz-recorde">Seu recorde: <strong>${info.melhor}/${OFICINA.length}</strong>${info.passou ? " · ✅ selo conquistado" : ""}</p>` : ""}
        </div>`;
    }

    function ofRodada() {
      const q = ofOrdem[ofAtual];
      const idx = embaralhar(q.o.map((_, i) => i));
      oficinaCaixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo"><span>Rodada ${ofAtual + 1}/${ofOrdem.length}</span><span>${ofPontos} acerto${ofPontos === 1 ? "" : "s"}</span></div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(ofAtual / ofOrdem.length) * 100}%"></div></div>
          <p class="oficina-cenario">📌 ${q.c}</p>
          <p class="oficina-fraco">Prompt fraco: <em>"${q.f}"</em></p>
          <h3 class="quiz-pergunta" style="font-size:1rem">Qual é a melhor versão?</h3>
          <div class="quiz-opcoes">
            ${idx.map((i) => `<button class="quiz-opcao" data-of-op="${i}">${q.o[i]}</button>`).join("")}
          </div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-of="proxima">Próxima →</button>
        </div>`;
    }

    function ofResponder(i) {
      const q = ofOrdem[ofAtual];
      const certo = i === q.r;
      if (certo) ofPontos++;
      oficinaCaixa.querySelectorAll("[data-of-op]").forEach((b) => {
        b.disabled = true;
        const idx = Number(b.dataset.ofOp);
        if (idx === q.r) b.classList.add("correta");
        else if (idx === i) b.classList.add("errada");
      });
      const fb = oficinaCaixa.querySelector(".quiz-feedback");
      fb.textContent = (certo ? "✅ Boa! " : "❌ Quase. ") + q.e;
      fb.classList.remove("oculto");
      const btn = oficinaCaixa.querySelector('[data-of="proxima"]');
      btn.textContent = ofAtual + 1 < ofOrdem.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }

    function ofFim() {
      const passou = ofPontos >= 6;
      estado.oficina.melhor = Math.max(estado.oficina.melhor, ofPontos);
      estado.oficina.passou = estado.oficina.passou || passou;
      salvar();
      if (passou) festejar();
      oficinaCaixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${ofPontos === OFICINA.length ? "🏆 Prompts perfeitos!" : passou ? "🛠️ Selo conquistado!" : "💪 Treina mais um pouco!"}</h3>
          <p class="quiz-nota">${ofPontos}/${OFICINA.length}</p>
          <p>${passou ? "Você agora pensa como engenheiro(a) de prompts. Use isso em TODO pedido que fizer ao Claude." : "Acerte 6 para o selo. Releia as 4 regras do Nível 1 e volte!"}</p>
          ${passou ? '<p class="quiz-selo">✅ Engenheiro(a) de Prompts</p>' : ""}
          <button class="btn btn-primario" data-of="comecar" style="margin-top:.8rem">Jogar de novo</button>
        </div>`;
    }

    oficinaCaixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-of]");
      const op = ev.target.closest("[data-of-op]");
      if (acao && acao.dataset.of === "comecar") {
        ofOrdem = embaralhar(OFICINA); ofAtual = 0; ofPontos = 0; ofRodada();
      } else if (acao && acao.dataset.of === "proxima") {
        ofAtual++;
        if (ofAtual < ofOrdem.length) ofRodada(); else ofFim();
      } else if (op && !op.disabled) {
        ofResponder(Number(op.dataset.ofOp));
      }
    });

    ofInicio();
  }

  /* ============================================================
     DESAFIO MESTRE — quiz avançado e difícil (especialista)
     Distratores plausíveis; a resposta certa nem sempre é a "óbvia".
     ============================================================ */
  const DESAFIO = [
    { p: "No Sonnet 4.6 (US$ 3 por milhão de tokens de entrada e US$ 15 de saída), uma tarefa usa 2 milhões de tokens de entrada e 400 mil de saída. Quanto custa, aproximadamente?",
      o: ["US$ 12,00", "US$ 7,20", "US$ 18,00", "US$ 9,00"], c: 0,
      e: "Entrada: 2 × US$3 = US$6. Saída: 0,4 × US$15 = US$6. Total ≈ US$ 12." },
    { p: "Processar o MESMO volume de tokens no Opus 4.8 (US$5/US$25) em vez do Haiku 4.5 (US$1/US$5) custa cerca de…",
      o: ["o mesmo", "2× mais", "5× mais", "10× mais"], c: 2,
      e: "5/1 na entrada e 25/5 na saída = 5× mais caro. Por isso só suba para o Opus quando a tarefa exigir." },
    { p: "Sobre o cache de prompt da API, o que é VERDADE?",
      o: ["Toda chamada fica 90% mais barata automaticamente", "Escrever no cache custa MAIS que o normal; a economia vem das leituras seguintes", "Ele deixa as respostas mais inteligentes", "Guarda as respostas prontas para não repetir o trabalho"], c: 1,
      e: "Gravar no cache custa ~1,25× um token normal; quem barateia (até ~90%) são as LEITURAS das próximas chamadas com o mesmo conteúdo." },
    { p: "Qual modelo NÃO tem janela de contexto de 1 milhão de tokens?",
      o: ["Sonnet 4.6", "Opus 4.8", "Haiku 4.5", "Fable 5"], c: 2,
      e: "O Haiku 4.5 trabalha com 200 mil tokens; Sonnet, Opus e Fable chegam a 1 milhão." },
    { p: "Uma IA precisa refatorar sozinha um sistema enorme por horas, parando e retomando com autonomia. Mesmo sendo 'caro', o ideal é…",
      o: ["Haiku, para economizar", "Sonnet, é equilibrado", "Opus, especialista em tarefas longas e autônomas", "Tanto faz, todos fazem igual"], c: 2,
      e: "Autonomia em tarefas longas e complexas é a especialidade do Opus. Economizar com Haiku aqui sairia caro em retrabalho." },
    { p: "No MCP, quem é o CLIENTE e quem é o SERVIDOR?",
      o: ["Cliente é o servidor da Anthropic; servidor é o seu PC", "Cliente é o claude.ai / Claude Code / app; servidor é o programa que expõe as ferramentas", "Cliente é o usuário; servidor é a internet", "São a mesma coisa"], c: 1,
      e: "O cliente (claude.ai, Claude Code…) consome ferramentas e dados que o servidor MCP expõe." },
    { p: "Qual comando adiciona um servidor MCP remoto via HTTP no Claude Code?",
      o: ["claude install mcp <url>", "claude mcp add --transport http <nome> <url>", "npm add mcp <url>", "claude connect <url>"], c: 1,
      e: "É 'claude mcp add --transport http nome URL'. Para listar: 'claude mcp list'." },
    { p: "O Batch API dá 50% de desconto. Qual é a contrapartida?",
      o: ["A qualidade cai pela metade", "Só funciona com o Haiku", "As respostas não são imediatas (podem levar até 24h)", "Você paga uma assinatura extra"], c: 2,
      e: "O lote troca pressa por preço: até 50% mais barato para tarefas que podem esperar." },
    { p: "Você quer que o Claude escreva e-mails EXATAMENTE no estilo da sua empresa. Qual técnica é a MAIS eficaz?",
      o: ["Escrever 'seja profissional e caprichado'", "Colar 2 ou 3 e-mails reais e pedir para seguir aquele padrão", "Usar sempre o modelo mais caro", "Escrever o pedido em letras maiúsculas"], c: 1,
      e: "Mostrar exemplos reais (few-shot) transfere estilo muito melhor do que qualquer adjetivo como 'profissional'." },
    { p: "Qual a diferença entre um 'workflow' e um 'agente'?",
      o: ["Não há diferença", "No workflow você controla os passos; o agente decide sozinho a sequência até atingir o objetivo", "Workflow é pago, agente é grátis", "Agente só funciona no celular"], c: 1,
      e: "Workflow = você orquestra os passos. Agente = ele planeja, usa ferramentas, verifica e refaz até concluir." },
    { p: "Qual afirmação está CORRETA?",
      o: ["Projeto é um app gerado; Artifact guarda instruções fixas", "Projeto guarda instruções/arquivos permanentes; Artifact é um produto gerado ao lado do chat", "Os dois são a mesma coisa", "Artifact é um plano de assinatura"], c: 1,
      e: "Projetos = contexto permanente (instruções + arquivos). Artifacts = entregáveis (apps, docs, gráficos) montados ao lado da conversa." },
    { p: "Ligar o 'pensamento estendido' tende a…",
      o: ["Deixar tudo mais rápido", "Gastar mais tokens/tempo, melhorando respostas difíceis", "Ser sempre melhor e de graça", "Desligar a pesquisa na web"], c: 1,
      e: "Ele pensa mais antes de responder: ótimo para lógica e cálculo, mas custa mais tempo e tokens. Para perguntas simples, deixe desligado." },
    { p: "Aproximadamente quantos tokens tem um texto de 100 palavras em português?",
      o: ["Exatamente 100", "Cerca de 10", "Entre 130 e 300", "Mais de 5.000"], c: 2,
      e: "Em média 1 a 3 tokens por palavra → ~130 a 300 tokens para 100 palavras." },
    { p: "Quando faz sentido usar o Fable 5 no lugar do Opus 4.8?",
      o: ["Sempre — é melhor e mais barato em tudo", "Em tarefas simples para economizar", "Em problemas extremamente difíceis, onde nem o Opus dá conta", "Para classificar e-mails em massa"], c: 2,
      e: "Fable 5 é o topo de linha (e o mais caro): reservado para os problemas mais difíceis. Tarefas simples = Haiku." },
    { p: "Qual prática com a chave de API é SEGURA?",
      o: ["Colar a chave direto no código do site", "Compartilhar no grupo da equipe", "Guardar em variável de ambiente / cofre de senhas, fora do código", "Subir para o GitHub como backup"], c: 2,
      e: "Chave é segredo: variável de ambiente ou cofre. Quem tem sua chave gasta na sua conta." },
    { p: "Subagentes servem principalmente para…",
      o: ["Deixar a resposta mais barata", "Dividir um trabalho grande em ajudantes que rodam em PARALELO", "Traduzir para outros idiomas", "Economizar bateria do celular"], c: 1,
      e: "Um pesquisa, outro escreve, outro revisa — ao mesmo tempo. Paralelismo, não economia." },
    { p: "A 'memória' do Claude e a 'janela de contexto' são…",
      o: ["A mesma coisa", "Diferentes: memória persiste ENTRE conversas; contexto é o que cabe DENTRO de uma conversa", "Ambas infinitas", "Recursos só de empresas"], c: 1,
      e: "Contexto = memória de trabalho de uma conversa. Memória = o que ele lembra de você entre conversas (e você controla)." },
    { p: "Para um contrato jurídico rascunhado pelo Claude, o correto é…",
      o: ["Enviar direto ao cliente", "Confiar 100%, ele não erra em direito", "Usar como rascunho e SEMPRE revisar com um humano/advogado", "Publicar para validar com o público"], c: 2,
      e: "IA acelera, humano assina. Documentos sérios sempre passam por revisão profissional." },
    { p: "Ao conectar o Google Drive, como o Claude ganha acesso?",
      o: ["Você digita sua senha do Google no chat", "Ele acessa tudo automaticamente", "Você autoriza via login (OAuth); o acesso é com sua permissão e revogável", "Por e-mail para a Anthropic"], c: 2,
      e: "Conectores usam autorização (OAuth). Você nunca digita senha no chat e pode desconectar quando quiser." },
    { p: "Para gerar uma resposta MUITO longa (dezenas de milhares de tokens) sem dar erro de tempo, o recomendado é…",
      o: ["Pedir tudo de uma vez, sem mais nada", "Usar streaming (resposta em fluxo)", "Diminuir a janela de contexto", "Trocar para o Haiku"], c: 1,
      e: "Saídas muito grandes devem usar streaming, senão a requisição pode estourar o tempo limite." },
    { p: "Por que só instalar servidores MCP de fontes confiáveis?",
      o: ["Para economizar internet", "Porque eles podem executar AÇÕES REAIS nas suas contas e no seu PC", "Para o app ficar bonito", "Não importa a fonte"], c: 1,
      e: "Um servidor MCP tem poder real (criar, apagar, enviar). Fonte não confiável = risco de verdade." },
    { p: "O que o comando /init faz no Claude Code?",
      o: ["Reinicia o computador", "Cria o arquivo CLAUDE.md, um 'manual do projeto' lido em toda sessão", "Instala o Node.js", "Apaga o histórico"], c: 1,
      e: "O /init gera o CLAUDE.md com convenções e comandos do projeto — contexto permanente para o agente." },
    { p: "A 'pesquisa profunda' difere da busca normal porque…",
      o: ["É mais rápida", "Investiga por vários minutos, cruza muitas fontes e entrega um relatório com referências", "Só busca no seu celular", "Não cita fontes"], c: 1,
      e: "É a investigação avançada: leva tempo, mas devolve um relatório fundamentado com as fontes." },
  ];

  const desafioCaixa = document.getElementById("desafioCaixa");
  if (desafioCaixa) {
    const N_DESAFIO = Math.min(12, DESAFIO.length);
    let ordem = [], atual = 0, pontos = 0;

    function dInicio() {
      const info = estado.desafio;
      desafioCaixa.innerHTML = `
        <div class="quiz-inicio">
          <p><strong>${N_DESAFIO} perguntas difíceis</strong> sorteadas de um banco de ${DESAFIO.length}.
          Você pode (e vai!) errar algumas. Acerte <strong>80%+</strong> (no mínimo ${Math.ceil(N_DESAFIO*0.8)} de ${N_DESAFIO}) para o título de Mestre. 🎓</p>
          <button class="btn btn-primario" data-d="comecar">Aceitar o desafio</button>
          ${info.melhor ? `<p class="quiz-recorde">Seu recorde: <strong>${info.melhor}%</strong>${info.passou ? " · 🎓 Mestre do Claude" : ""}</p>` : ""}
        </div>`;
    }
    function dRodada() {
      const q = ordem[atual];
      const idx = embaralhar(q.o.map((_, i) => i));
      desafioCaixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo"><span>Pergunta ${atual + 1}/${ordem.length}</span><span>${pontos} acerto${pontos === 1 ? "" : "s"}</span></div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(atual / ordem.length) * 100}%"></div></div>
          <h3 class="quiz-pergunta">${q.p}</h3>
          <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-d-op="${i}">${q.o[i]}</button>`).join("")}</div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-d="proxima">Próxima →</button>
        </div>`;
    }
    function dResponder(i) {
      const q = ordem[atual];
      if (i === q.c) pontos++;
      desafioCaixa.querySelectorAll("[data-d-op]").forEach((b) => {
        b.disabled = true;
        const idx = Number(b.dataset.dOp);
        if (idx === q.c) b.classList.add("correta");
        else if (idx === i) b.classList.add("errada");
      });
      const fb = desafioCaixa.querySelector(".quiz-feedback");
      fb.textContent = (i === q.c ? "✅ Acertou! " : "❌ Errou. ") + q.e;
      fb.classList.remove("oculto");
      const btn = desafioCaixa.querySelector('[data-d="proxima"]');
      btn.textContent = atual + 1 < ordem.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }
    function dFim() {
      const pct = Math.round((pontos / ordem.length) * 100);
      const passou = pct >= 80;
      estado.desafio.melhor = Math.max(estado.desafio.melhor, pct);
      estado.desafio.passou = estado.desafio.passou || passou;
      salvar();
      if (passou) festejar();
      desafioCaixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${pct === 100 ? "🏆 Perfeito — você é fera!" : passou ? "🎓 Você é um Mestre do Claude!" : "💪 Quase! Esse é difícil mesmo."}</h3>
          <p class="quiz-nota">${pontos}/${ordem.length}</p>
          <p>${passou ? "Título de Mestre conquistado. Poucos acertam esse." : "Reveja a explicação de cada pergunta — é aí que mora o aprendizado. Tente de novo!"}</p>
          ${passou ? '<p class="quiz-selo">🎓 Mestre do Claude</p>' : ""}
          <button class="btn btn-primario" data-d="comecar" style="margin-top:.8rem">Tentar de novo</button>
        </div>`;
    }
    desafioCaixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-d]");
      const op = ev.target.closest("[data-d-op]");
      if (acao && acao.dataset.d === "comecar") { ordem = embaralhar(DESAFIO).slice(0, N_DESAFIO); atual = 0; pontos = 0; dRodada(); }
      else if (acao && acao.dataset.d === "proxima") { atual++; if (atual < ordem.length) dRodada(); else dFim(); }
      else if (op && !op.disabled) { dResponder(Number(op.dataset.dOp)); }
    });
    dInicio();
  }

  /* ---------------- Tamanho da letra (A− / A+) ---------------- */
  function aplicarFonte() {
    document.documentElement.style.fontSize = estado.fonte + "px";
  }
  const fonteMenor = document.getElementById("fonteMenor");
  const fonteMaior = document.getElementById("fonteMaior");
  if (fonteMenor && fonteMaior) {
    fonteMenor.addEventListener("click", () => {
      estado.fonte = Math.max(14, estado.fonte - 1);
      aplicarFonte(); salvar();
    });
    fonteMaior.addEventListener("click", () => {
      estado.fonte = Math.min(21, estado.fonte + 1);
      aplicarFonte(); salvar();
    });
  }
  if (estado.fonte !== 16) aplicarFonte();

  /* ============================================================
     MODO TERCEIRA IDADE — muda tudo para facilitar os mais velhos:
     tema claro de alto contraste, letras e botões grandes,
     explicações em palavras simples, voz mais devagar, mais tempo no jogo
     ============================================================ */

  // Explicação bem simples de cada etapa, em letras grandes, para quem
  // está conhecendo a tecnologia agora. Linguagem do dia a dia, sem termos difíceis.
  const SENIOR_EXPLICACAO = {
    "m1-1":
      "<p><strong>O que é o Claude?</strong></p>" +
      "<p>O Claude é um ajudante inteligente que mora no seu celular ou computador. " +
      "Ele é parecido com uma pessoa muito estudada que está sempre disponível para conversar com você.</p>" +
      "<p>Você <strong>escreve uma pergunta ou um pedido</strong>, como se estivesse mandando uma mensagem no WhatsApp, " +
      "e ele responde na hora. Ele pode escrever textos, explicar coisas, ajudar a resolver problemas e muito mais.</p>" +
      "<p>👉 <strong>Não precisa ter medo:</strong> você não estraga nada. É só conversar. Se errar, é só perguntar de novo.</p>",
    "m1-2":
      "<p><strong>Como começar a usar</strong></p>" +
      "<p>É parecido com criar um WhatsApp novo. Você precisa de um e-mail e uma senha.</p>" +
      "<p><strong>Passo a passo:</strong></p>" +
      "<p>1. No celular, abra a loja de aplicativos (a mesma onde você baixa outros apps).</p>" +
      "<p>2. Procure por <strong>Claude</strong> e instale.</p>" +
      "<p>3. Abra o aplicativo e crie sua conta com seu e-mail.</p>" +
      "<p>4. Pronto! Já pode conversar. É de graça para começar.</p>" +
      "<p>👉 Se precisar, peça para um filho ou neto ajudar na primeira vez.</p>",
    "m1-3":
      "<p><strong>Conhecendo a tela</strong></p>" +
      "<p>A tela do Claude é simples, parecida com a de uma conversa de WhatsApp.</p>" +
      "<p>• Lá embaixo tem um espaço para você <strong>escrever sua pergunta</strong>.</p>" +
      "<p>• Tem um <strong>botãozinho de microfone</strong> 🎤: se você apertar, pode <strong>falar em vez de digitar</strong>. Ótimo para quem não gosta de teclado!</p>" +
      "<p>• Tem um <strong>clipe</strong> 📎 para anexar uma foto. Você pode tirar foto de uma carta, uma receita de remédio ou um documento e pedir para ele explicar.</p>" +
      "<p>👉 <strong>Dica:</strong> para cada assunto novo, comece uma conversa nova (o botão com o sinal de mais ➕).</p>",
    "m1-4":
      "<p><strong>Os tipos de Claude</strong></p>" +
      "<p>Existe mais de uma versão do Claude, como se fossem ajudantes diferentes. Não se preocupe em decorar!</p>" +
      "<p>• Um é mais <strong>rápido</strong>, bom para perguntas simples.</p>" +
      "<p>• Outro é <strong>equilibrado</strong>, bom para quase tudo.</p>" +
      "<p>• Outro é o mais <strong>inteligente</strong>, para tarefas difíceis.</p>" +
      "<p>👉 <strong>O mais importante:</strong> não precisa escolher nada agora. O aplicativo já vem com um bom ajudante pronto. " +
      "Só comece a conversar normalmente.</p>",
    "m1-5":
      "<p><strong>Como pedir as coisas</strong></p>" +
      "<p>Quanto mais você explica o que quer, melhor ele ajuda. É como pedir uma informação na rua: " +
      "se você dá detalhes, a pessoa te ajuda melhor.</p>" +
      "<p><strong>Em vez de:</strong> \"escreve uma carta\"</p>" +
      "<p><strong>Diga:</strong> \"escreve uma carta para meu neto, com carinho, contando que estou com saudade\".</p>" +
      "<p>👉 Se a resposta não ficou boa, é só pedir: \"deixa mais curto\" ou \"explica mais fácil\". Ele refaz na hora, sem reclamar.</p>" +
      "<p>⚠️ <strong>Cuidado importante:</strong> nunca digite senhas de banco ou número de cartão. Nenhum aplicativo de conversa precisa disso.</p>",
    "m2-1":
      "<p><strong>Guardando suas coisas</strong></p>" +
      "<p>O Claude deixa você criar \"pastinhas\" para organizar conversas do mesmo assunto. " +
      "É como ter uma gaveta separada para cada tema.</p>" +
      "<p>Por exemplo: uma pasta para receitas de comida, outra para assuntos da família, outra para a igreja.</p>" +
      "<p>👉 Isso é um recurso mais avançado. Por enquanto, não se preocupe: " +
      "use o Claude conversando normalmente. Quando quiser organizar, esta pasta estará aqui.</p>",
    "m2-2":
      "<p><strong>Ele cria coisas prontas para você</strong></p>" +
      "<p>O Claude não só responde com texto. Ele pode <strong>montar coisas prontas</strong>, como:</p>" +
      "<p>• Uma lista de compras organizada</p>" +
      "<p>• Um convite de aniversário bonito</p>" +
      "<p>• Uma cartinha já formatada</p>" +
      "<p>👉 É só pedir, por exemplo: \"faça um convite para o meu aniversário de 70 anos, no domingo, na minha casa\". " +
      "Ele monta tudo prontinho.</p>",
    "m2-3":
      "<p><strong>Ligando com outros aplicativos</strong></p>" +
      "<p>O Claude pode se conectar com outras coisas suas, como seus e-mails ou suas fotos guardadas na internet — " +
      "<strong>só se você permitir</strong>.</p>" +
      "<p>Por exemplo, ele pode te ajudar a achar um e-mail importante ou resumir um documento longo.</p>" +
      "<p>👉 Este é um recurso avançado. Não precisa mexer nisso agora. " +
      "Quando você já estiver acostumado, peça ajuda de um familiar para configurar.</p>",
    "m2-4":
      "<p><strong>Buscar, fotos e voz</strong></p>" +
      "<p>Três coisas muito úteis:</p>" +
      "<p>• <strong>Buscar na internet:</strong> ele pode procurar coisas novas, como o preço de um remédio ou uma notícia de hoje.</p>" +
      "<p>• <strong>Fotos:</strong> tire foto de um papel e peça para ele ler ou explicar. Ótimo para letras pequenas!</p>" +
      "<p>• <strong>Voz:</strong> aperte o microfone e fale. Ele entende e responde.</p>" +
      "<p>👉 A foto é maravilhosa para entender bulas de remédio e contas com letra miúda.</p>",
    "m2-5":
      "<p><strong>Como o Claude ajuda no seu dia a dia</strong></p>" +
      "<p>Veja coisas práticas que ele faz por você:</p>" +
      "<p>• Escrever mensagens carinhosas para a família</p>" +
      "<p>• Explicar uma palavra difícil ou uma notícia</p>" +
      "<p>• Ajudar a montar a lista de compras do mês</p>" +
      "<p>• Dar ideias de receitas com o que você tem em casa</p>" +
      "<p>• Lembrar como se faz alguma coisa no celular</p>" +
      "<p>👉 Pense nele como um neto paciente, que nunca se cansa de explicar.</p>",
    "m2-6":
      "<p><strong>Dicas para pedir melhor</strong></p>" +
      "<p>Um truque simples: peça para ele <strong>explicar como se você tivesse pouca intimidade com tecnologia</strong>. " +
      "Ele vai usar palavras fáceis.</p>" +
      "<p>Por exemplo: \"me explique isso de um jeito bem simples, passo a passo, como se eu nunca tivesse usado\".</p>" +
      "<p>👉 Não tenha pressa. Pode perguntar quantas vezes quiser. Ele tem toda a paciência do mundo.</p>",
    "m3-1":
      "<p><strong>Recursos mais avançados</strong></p>" +
      "<p>Esta parte é para quem quer ir além e usar o Claude no computador para fazer tarefas mais complicadas.</p>" +
      "<p>👉 <strong>Você não precisa disto para aproveitar o Claude!</strong> " +
      "Esta parte é mais técnica, usada por pessoas que trabalham com computador. " +
      "Pode pular sem problema nenhum e continuar usando o aplicativo normalmente.</p>",
    "m3-2":
      "<p><strong>Para empresas e programadores</strong></p>" +
      "<p>Existe uma forma de empresas colocarem o Claude dentro dos sistemas delas. " +
      "É coisa de gente que trabalha com computador.</p>" +
      "<p>👉 Pode pular tranquilo. Isto não muda em nada o seu uso do dia a dia. " +
      "O importante você já aprendeu nas partes anteriores.</p>",
    "m3-3":
      "<p><strong>Conexões avançadas</strong></p>" +
      "<p>Esta parte explica como o Claude se liga, por dentro, a outros programas. " +
      "É bem técnico.</p>" +
      "<p>👉 Não precisa entender isto para usar o Claude no seu dia a dia. " +
      "Sinta-se à vontade para pular.</p>",
    "m3-4":
      "<p><strong>O Claude trabalhando sozinho</strong></p>" +
      "<p>O Claude pode fazer tarefas mais longas sozinho, como um funcionário cuidando de coisas repetitivas. " +
      "Isso é mais usado em empresas.</p>" +
      "<p>👉 Para você, o mais útil é saber que ele pode te ajudar com várias tarefas. " +
      "Esta parte mais técnica pode ser pulada.</p>",
    "m3-5":
      "<p><strong>Segurança — isto SIM é importante para você!</strong></p>" +
      "<p>Algumas regras simples para ficar seguro:</p>" +
      "<p>• <strong>Nunca</strong> digite senha de banco, número de cartão ou senha do PIX.</p>" +
      "<p>• Desconfie se alguém pedir esses dados — golpistas existem.</p>" +
      "<p>• O Claude pode errar às vezes. Para coisas sérias, como remédios, sempre confirme com seu médico.</p>" +
      "<p>👉 Use o Claude para te ajudar e tirar dúvidas, mas para decisões importantes, " +
      "confie sempre numa pessoa de confiança também.</p>",
  };

  let seniorBoxes = [];

  function aplicarSenior() {
    document.body.classList.toggle("senior", estado.senior);

    document.querySelectorAll("#seniorBtn, #seniorHeroBtn, #seniorCatBtn").forEach((b) => {
      b.setAttribute("aria-pressed", String(estado.senior));
      b.classList.toggle("ativo", estado.senior);
    });
    const catBtn = document.getElementById("seniorCatBtn");
    if (catBtn) catBtn.textContent = estado.senior ? "Sair do Modo Terceira Idade" : "Ativar Modo Terceira Idade";

    if (estado.senior) {
      // injeta a explicação simples no topo de cada etapa
      document.querySelectorAll(".modulo[data-modulo]").forEach((secao) => {
        const mod = secao.dataset.modulo;
        if (!SENIOR_EXPLICACAO[mod] || secao.querySelector(".senior-box")) return;
        const box = document.createElement("div");
        box.className = "senior-box";
        box.innerHTML =
          '<span class="senior-box-tag">👵 Explicação fácil</span>' + SENIOR_EXPLICACAO[mod];
        const cab = secao.querySelector(".modulo-cabecalho");
        cab.insertAdjacentElement("afterend", box);
        seniorBoxes.push(box);
      });
    } else {
      seniorBoxes.forEach((b) => b.remove());
      seniorBoxes = [];
    }
  }

  document.querySelectorAll("#seniorBtn, #seniorHeroBtn, #seniorCatBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      estado.senior = !estado.senior;
      if (estado.senior && estado.fonte < 20) { estado.fonte = 20; aplicarFonte(); }
      if (!estado.senior && estado.fonte === 20) { estado.fonte = 16; aplicarFonte(); }
      salvar();
      aplicarSenior();
      avisar(estado.senior
        ? "👵 Modo Terceira Idade ligado: letras grandes e explicações fáceis!"
        : "Modo normal de volta.");
    });
  });
  if (estado.senior) aplicarSenior();

  /* ---------------- Banner de instalação no iPhone/iPad ---------------- */
  const ehIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const emApp = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const iosBanner = document.getElementById("iosBanner");
  if (iosBanner && ehIOS && !emApp && !estado.iosBannerFechado) {
    setTimeout(() => iosBanner.classList.remove("oculto"), 2500);
    document.getElementById("iosBannerFechar").addEventListener("click", () => {
      iosBanner.classList.add("oculto");
      estado.iosBannerFechado = true;
      salvar();
    });
  }

  /* ============================================================
     LEITURA EM VOZ ALTA — botão 🔊 Ouvir em cada etapa
     Usa a voz em português do próprio aparelho (grátis, offline)
     ============================================================ */
  const sintese = window.speechSynthesis;
  let leitura = { fila: [], idx: 0, btn: null, parar: null, estado: "parado" };
  let vozFixa = null; // sempre a MESMA voz na sessão inteira

  // Escolhe a melhor voz em português do aparelho UMA vez e fixa para sempre
  function vozPortugues() {
    if (vozFixa) return vozFixa;
    const vozes = (sintese ? sintese.getVoices() : []).filter((v) => /^pt([-_]|$)/i.test(v.lang));
    if (!vozes.length) return null;
    // se já escolhemos uma voz antes neste aparelho, reusa a mesma
    if (estado.vozNome) {
      const salva = vozes.find((v) => v.name === estado.vozNome);
      if (salva) { vozFixa = salva; return vozFixa; }
    }
    const nota = (v) => {
      const n = v.name.toLowerCase();
      let s = 0;
      if (/br/i.test(v.lang)) s += 5;                                       // português do Brasil
      if (n.includes("google")) s += 4;                                     // voz do Google (Android)
      if (/luciana|felipe|francisca|camila|thalita|antonio/.test(n)) s += 3; // boas vozes iOS/Windows
      if (/natural|enhanced|premium|aprimorad|neural/.test(n)) s += 3;      // versões de alta qualidade
      if (!v.localService) s += 1;
      return s;
    };
    // desempate por nome para a escolha ser sempre idêntica no mesmo aparelho
    vozFixa = vozes.sort((a, b) => nota(b) - nota(a) || a.name.localeCompare(b.name))[0];
    estado.vozNome = vozFixa.name;
    salvar();
    return vozFixa;
  }
  if (sintese) {
    sintese.getVoices(); // dispara o carregamento das vozes
    if (typeof sintese.addEventListener === "function") {
      sintese.addEventListener("voiceschanged", () => { if (!vozFixa) vozPortugues(); });
    }
  }

  function textoDaEtapa(secao) {
    const clone = secao.cloneNode(true);
    clone.querySelectorAll("pre, button, input, select, .quiz-caixa, .ouvir-controles").forEach((e) => e.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  /* Narração humanizada — roteiro de professor escrito para ser OUVIDO,
     em vez da leitura crua do texto da tela */
  const NARRACAO = {
    "m1-1":
      "Olá! Que bom ter você aqui. Eu vou te acompanhar nessa jornada para dominar o Claude. " +
      "Vamos começar pelo começo: o que é o Claude? O Claude é uma inteligência artificial criada pela Anthropic, uma empresa americana fundada em 2021, referência mundial em segurança de IA. " +
      "Na prática, pensa assim: é um assistente super preparado, disponível vinte e quatro horas. Você escreve o que precisa, como numa conversa de WhatsApp, e ele escreve textos, resume documentos, traduz, programa, analisa fotos e planilhas. De tudo. " +
      "Antes de seguir, guarda três palavrinhas que aparecem o curso inteiro. Primeira: prompt. É o pedido que você escreve para a IA. Quanto mais claro, melhor a resposta. " +
      "Segunda: token. É o pedacinho de texto que a IA lê e escreve. Uma palavra tem de um a três tokens. " +
      "Terceira: janela de contexto. É a memória de trabalho do modelo, quanto texto ele considera de uma vez. Os modelos atuais do Claude trabalham com até um milhão de tokens. Cabe um livro inteiro numa conversa! " +
      "Agora é com você: faça as missões práticas aqui embaixo. É fazendo que se aprende!",
    "m1-2":
      "Nesta etapa, vamos colocar você dentro do Claude. Criar a conta é fácil: entra no site claude ponto a i, ou baixa o aplicativo Claude na loja do celular, e faz o cadastro com seu e-mail ou conta Google. Pronto: a tela principal é um chat. " +
      "Sobre os planos: existe o gratuito, ótimo para conhecer, com limite de mensagens que renova com o tempo. O plano Pro é a assinatura de quem usa todo dia: muito mais uso, mais modelos, e recursos como Projetos e conectores. " +
      "Para uso intenso existe o Max, e para empresas, os planos Team e Enterprise. " +
      "Importante: no claude ponto a i você paga assinatura fixa. Pagar por token é só na A P I, coisa de desenvolvedor, que veremos no nível três. " +
      "E saiba que o Claude vive em quatro lugares: no site e nos aplicativos, que é onde você vai usar; no Claude Code; na A P I; e nas nuvens das grandes empresas. " +
      "Sua missão: baixar o aplicativo e mandar a primeira mensagem. Vai lá!",
    "m1-3":
      "Agora eu vou te mostrar a tela do Claude, botão por botão. " +
      "Primeiro, o botão de nova conversa, o sinal de mais. Cria esse hábito de ouro: cada assunto numa conversa nova. As respostas ficam muito melhores. " +
      "Perto do campo de digitação tem o seletor de modelo, onde você escolhe qual versão do Claude responde. Na próxima etapa eu te ensino a escolher. " +
      "Tem o modo de raciocínio, o pensamento estendido. Ligado, o Claude pensa por mais tempo antes de responder: bom para matemática, lógica, decisões importantes. Desligado, ele responde mais rápido. " +
      "O clipezinho anexa arquivos: PDF, foto, planilha, e ele lê tudo. Faz o teste: tira foto de um documento e pede, explica isso em linguagem simples. É mágico. " +
      "Tem a pesquisa na web, para informação atualizada da internet. E no celular dá para falar em vez de digitar, no microfone. " +
      "Suas conversas ficam salvas no histórico, e nas configurações você ajusta até o estilo de escrita dele. Agora explora as missões aí embaixo!",
    "m1-4":
      "Essa é uma das etapas mais importantes do curso: os modelos do Claude. O Claude é uma família, e cada modelo equilibra inteligência, velocidade e preço de um jeito. " +
      "O Haiku é o veloz e econômico. Pensa num motoboy: entrega rápido e cobra pouco. Perfeito para tarefas simples e repetitivas em grande volume. " +
      "O Sonnet é o equilibrado, um gerente competente: resolve quase tudo do dia a dia com ótimo custo. É o seu ponto de partida. " +
      "O Opus é o especialista, um engenheiro sênior: encara trabalhos longos e difíceis, e trabalha horas sozinho. " +
      "E o Fable cinco é o topo de linha, o cientista-chefe: chamado quando nem o Opus dá conta. " +
      "Agora a regra de bolso que vale ouro: comece sempre pelo Sonnet. Tarefa simples e repetitiva? Desce pro Haiku e economiza. Complexa e longa? Sobe pro Opus. " +
      "Toca nos cartões da tela para ver os detalhes, e faz a missão: compara dois modelos com a mesma pergunta!",
    "m1-5":
      "Chegou a hora de aprender a pedir do jeito certo. As quatro regras do bom prompt. " +
      "Regra um: dê contexto. Em vez de, escreve um e-mail, fala: escreve um e-mail formal para um cliente, avisando que o pedido vai atrasar dois dias. Sentiu a diferença? " +
      "Regra dois: diga o formato. Responde em lista. No máximo três parágrafos. Em tabela. " +
      "Regra três: diga o porquê. Quando o Claude entende a intenção, a resposta melhora muito. " +
      "Regra quatro: não gostou? Pede ajuste. A conversa continua de onde parou: deixa mais curto, usa um tom mais leve. " +
      "E três cuidados desde já: a IA às vezes erra com confiança, é a tal da alucinação, então confere dados importantes. Para assuntos recentes, liga a pesquisa na web. E nunca compartilhe senhas ou dados sensíveis com nenhuma IA. " +
      "Depois dessa etapa vem o quiz do nível um. Setenta por cento e você passa. Você está indo muito bem!",
    "m2-1":
      "Bem-vindo ao nível dois! Agora vêm os superpoderes, começando pelos Projetos. " +
      "Um Projeto é uma pasta inteligente dentro do Claude: agrupa as conversas de um assunto, e recebe instruções fixas e arquivos de referência que valem para sempre. " +
      "Imagina: você cria o projeto, Posts da Loja, e escreve nas instruções: você é o assistente da minha loja, escreva sempre em tom alegre. Depois sobe o catálogo e a tabela de preços. " +
      "Pronto. Toda conversa nesse projeto já nasce sabendo tudo isso. Você só pede: faz o post do lançamento de sábado. " +
      "Para criar: no menu lateral, toca em Projetos, novo projeto, dá um nome, escreve as instruções e adiciona os arquivos. " +
      "Sua missão: criar seu primeiro projeto, chamado Meu Trabalho, com três linhas sobre você. Ele vai ser seu assistente pessoal daqui pra frente.",
    "m2-2":
      "Deixa eu te mostrar uma das coisas mais impressionantes do Claude: os Artifacts. " +
      "Quando você pede algo que é um produto, um documento, um site, um aplicativo, um gráfico, o Claude abre um painel ao lado do chat com o resultado pronto, funcionando e editável. " +
      "Quer ver? Pede: cria uma calculadora de gorjeta bonita e interativa. Em segundos aparece um aplicativinho de verdade na sua tela. E aí você lapida: muda a cor, adiciona divisão por pessoa. Ele atualiza na hora. " +
      "Dá para criar relatórios formatados, páginas de venda, formulários, fluxogramas, painéis com gráficos. Sem saber programar nada. " +
      "E ainda dá para publicar e compartilhar o link do que você criou. " +
      "Sua missão é óbvia: vai lá e pede seu primeiro Artifact, algo útil para o seu trabalho. Depois pede uma mudança e vê a mágica.",
    "m2-3":
      "Essa etapa é um divisor de águas: os conectores. " +
      "Sozinho, o Claude só enxerga o que você cola no chat. Com conectores, ele acessa as suas ferramentas de verdade: lê documentos do seu Google Drive, busca e-mails no Gmail, consulta sua agenda, cria tarefas no Notion. Sempre com a sua permissão. " +
      "Por baixo existe uma tecnologia chamada M C P. Pensa nela como o U S B das inteligências artificiais: um plugue universal que liga qualquer ferramenta a qualquer assistente. Foi a Anthropic que criou, e hoje o mercado inteiro usa. " +
      "Como instala? Anota: configurações, depois conectores. Lá tem um diretório, tipo uma lojinha. Escolhe a ferramenta, toca em conectar, autoriza com o login, pronto. " +
      "Na conversa, é só pedir naturalmente: resume o documento de planejamento que está no meu Drive. " +
      "Segurança: conectores só fazem o que você autorizar, e você desconecta quando quiser. Agora vai na missão e conecta o seu primeiro!",
    "m2-4":
      "Vamos completar seu arsenal com quatro recursos. " +
      "Primeiro, a pesquisa na web: ativa quando precisar de informação atual, como preços e notícias. O Claude busca e cita as fontes. " +
      "Quando precisar se aprofundar de verdade, existe a pesquisa profunda: ele investiga por vários minutos, cruza dezenas de fontes, e devolve um relatório completo com referências. " +
      "Segundo, os arquivos: manda PDF, Word, Excel, fotos, e pede, compara esses dois contratos, ou, acha inconsistências nessa planilha. Ele também cria arquivos prontos para baixar. " +
      "Terceiro, a memória: o Claude pode lembrar de você entre conversas, e você controla tudo nas configurações. " +
      "Quarto, a voz: no celular dá para conversar falando. " +
      "Missão: manda uma planilha de verdade para ele analisar, e se surpreende.",
    "m2-5":
      "Essa etapa é o coração do curso: o Claude no SEU trabalho. " +
      "Na tela tem botões com várias profissões: vendas, marketing, administrativo, jurídico, educação, saúde, tecnologia e autônomos. Toca na sua área e aparecem ideias prontas, cada uma com um prompt para copiar com um toque. " +
      "Por exemplo, vendas: propostas em minutos, preparação de reunião pesquisando o cliente, respostas para objeções, e o follow-up perfeito. " +
      "O segredo: copia o prompt, cola no Claude, e troca o que está entre colchetes pelas suas informações. Uma semana usando isso e você não vai saber viver sem. " +
      "Dica extra: na aba Meu Curso, dá para montar um plano completo personalizado para a sua profissão, com direito a um professor particular. " +
      "Missão de hoje: escolhe um prompt da sua área e usa agora, com um caso real seu.",
    "m2-6":
      "Hora de subir o nível dos seus prompts, com seis técnicas profissionais. " +
      "Um: defina um papel. Comece com, você é um contador especializado em pequenas empresas. A qualidade dispara. " +
      "Dois: mostre exemplos. Cola dois ou três textos do jeito que você gosta e fala: siga esse padrão. " +
      "Três: peça em etapas. Primeiro só a estrutura; aprovou, aí escreve seção por seção. " +
      "Quatro: peça crítica. Aponte três fraquezas desse texto antes de melhorar. A IA revisando o próprio trabalho rende muito. " +
      "Cinco: use o pensamento estendido para decisões importantes. " +
      "Seis: o que você repete sempre vira instrução fixa de um Projeto, e você nunca mais digita. " +
      "Depois do quiz do nível dois, você já estará na frente de noventa por cento das pessoas que usam IA. Bora!",
    "m3-1":
      "Bem-vindo ao nível avançado! Começando pela ferramenta mais poderosa: o Claude Code. " +
      "A diferença para o chat é uma só, mas gigante: o Claude Code age. Ele roda no seu computador, lê e edita arquivos, executa comandos, testa o que fez e corrige sozinho. Sempre pedindo sua aprovação nas ações importantes. " +
      "O que dá para fazer? Criar sites e sistemas inteiros só descrevendo. Corrigir problemas: você descreve, ele investiga e conserta. E o meu favorito: automatizar tarefas chatas, organizar centenas de arquivos, consolidar planilhas, gerar relatórios. " +
      "Para instalar: primeiro o Node, no site node js ponto org. Depois roda no terminal o comando que está na tela. Aí entra numa pasta, digita, claude, e conversa: o que tem nesta pasta? " +
      "Duas dicas: o comando barra init cria o manual do projeto, que ele lê sempre. E não tenha medo: ele mostra o plano antes de executar. " +
      "Mesmo que você não seja de tecnologia, faz a missão de instalar. Vale muito a pena.",
    "m3-2":
      "Agora a A P I: o jeito como as empresas colocam o Claude dentro dos próprios sistemas. " +
      "Pensa num chat de atendimento no site da empresa, num classificador automático de e-mails, num gerador de relatórios. Tudo isso é A P I. " +
      "O caminho: cria uma conta de desenvolvedor no console da Anthropic, gera uma chave, que é a senha secreta do seu aplicativo, e o seu sistema passa a conversar com o Claude. " +
      "Aqui, diferente da assinatura, você paga por uso: por milhão de tokens. Lembra da tabela de preços do nível um? É aqui que ela vale. " +
      "E dois truques de economia: o Batch processa tarefas sem pressa com cinquenta por cento de desconto, e o cache de prompt deixa contextos repetidos até noventa por cento mais baratos. " +
      "Mesmo sem programar, entender isso te deixa pronto para conversar de igual para igual com qualquer equipe de tecnologia.",
    "m3-3":
      "Lembra do M C P, o U S B das inteligências artificiais? Agora vamos abrir o capô. " +
      "Um servidor M C P é um programa que oferece ferramentas para a IA usar. O servidor do GitHub, por exemplo, oferece: criar tarefa, ler código, abrir pull request. " +
      "O cliente é quem consome: o claude ponto a i, o Claude Code, o aplicativo de desktop. " +
      "Existem servidores remotos, que rodam na internet e você conecta pelo endereço, e locais, que rodam no seu computador e acessam seus arquivos. " +
      "No Claude Code, adicionar um servidor é um comando só, que está na tela. " +
      "E quem programa pode criar o próprio servidor: a sua empresa pode expor o sistema interno como ferramentas que o Claude usa com segurança. " +
      "Só um alerta: servidor M C P executa ações reais nas suas contas. Instala só de fontes confiáveis, combinado?",
    "m3-4":
      "Essa etapa é sobre o futuro que já chegou: agentes e automações. " +
      "Um agente é uma IA que não só responde: ela executa um objetivo. Você dá a meta, ela planeja, usa ferramentas, verifica o resultado e tenta de novo até concluir. " +
      "Pensa em funcionários digitais cuidando das tarefas chatas: triagem de e-mails, monitoramento de planilhas, relatório toda sexta. Enquanto isso, você cuida do que importa. " +
      "Algumas peças desse mundo: as Skills são apostilas que ensinam o Claude a fazer as coisas do jeito da sua empresa. Os subagentes são ajudantes despachados em paralelo: um pesquisa, outro escreve, outro revisa, ao mesmo tempo. " +
      "No Claude Code dá para criar gatilhos automáticos e tarefas agendadas. " +
      "A missão dessa etapa é poderosa: pergunta ao Claude quais três tarefas do seu trabalho dá para automatizar, e pede o passo a passo da mais fácil. Você vai se surpreender.",
    "m3-5":
      "Última etapa de conteúdo, e talvez a mais importante para usar IA como profissional: segurança. " +
      "Grava essas regras. Senhas e chaves nunca entram em nenhuma IA. Nunca. " +
      "Dados de clientes, só conforme a política da empresa e a lei de proteção de dados. Na dúvida, não manda. " +
      "IA acelera, humano assina: documento importante, número e decisão passam pela sua revisão. " +
      "Chave de A P I é segredo absoluto: quem tem a sua chave, gasta na sua conta. " +
      "Conectores e agentes: só as permissões necessárias, e desconecta o que não usa. " +
      "Transparência: muitas vezes é boa prática avisar quando um conteúdo foi feito com IA. " +
      "E sempre confere fontes, números e fatos importantes. " +
      "Pronto! Agora faz o quiz do nível três, fecha os jogos, e busca o seu certificado. Foi uma honra te acompanhar. Agora vai, e usa essa ferramenta para transformar o seu trabalho!",
  };

  function quebrarEmFrases(texto) {
    const frases = texto.match(/[^.!?…]+[.!?…]*/g) || [texto];
    const fila = [];
    frases.forEach((f) => {
      f = f.trim();
      if (!f) return;
      // frases longas demais travam alguns navegadores — quebra por vírgula
      while (f.length > 220) {
        const corte = f.lastIndexOf(",", 220);
        const pedaco = corte > 60 ? f.slice(0, corte + 1) : f.slice(0, 220);
        fila.push(pedaco.trim());
        f = f.slice(pedaco.length).trim();
      }
      if (f) fila.push(f);
    });
    return fila;
  }

  function atualizarBotaoLeitura() {
    if (!leitura.btn) return;
    leitura.btn.textContent =
      leitura.estado === "falando" ? "⏸ Pausar" :
      leitura.estado === "pausado" ? "▶ Continuar" : "🔊 Ouvir esta etapa";
    if (leitura.parar) leitura.parar.classList.toggle("oculto", leitura.estado === "parado");
  }

  function pararLeitura() {
    if (!sintese) return;
    sintese.cancel();
    leitura.estado = "parado";
    leitura.fila = [];
    leitura.idx = 0;
    atualizarBotaoLeitura();
    leitura.btn = null;
    leitura.parar = null;
  }

  function falarProxima() {
    if (leitura.idx >= leitura.fila.length) {
      leitura.estado = "parado";
      atualizarBotaoLeitura();
      return;
    }
    const u = new SpeechSynthesisUtterance(leitura.fila[leitura.idx]);
    u.lang = "pt-BR";
    const voz = vozPortugues();
    if (voz) u.voice = voz;
    u.rate = estado.vozVel || 1;  // velocidade escolhida pelo usuário (0.5x a 2x)
    u.pitch = 1.0; // mesmo tom em todas as etapas
    u.onend = () => {
      leitura.idx++;
      if (leitura.estado === "falando" || leitura.estado === "pausado") falarProxima();
    };
    u.onerror = () => { leitura.idx++; if (leitura.estado !== "parado") falarProxima(); };
    sintese.speak(u);
  }

  if (sintese && "SpeechSynthesisUtterance" in window) {
    document.querySelectorAll(".modulo[data-modulo]").forEach((secao) => {
      if (secao.dataset.modulo.startsWith("quiz")) return; // quiz é interativo
      const cab = secao.querySelector(".modulo-cabecalho");
      if (!cab) return;
      const wrap = document.createElement("div");
      wrap.className = "ouvir-controles";
      wrap.innerHTML =
        '<button type="button" class="ouvir-btn">🔊 Ouvir esta etapa</button>' +
        '<button type="button" class="ouvir-parar oculto" aria-label="Parar leitura">⏹ Parar</button>' +
        '<button type="button" class="ouvir-vel" aria-label="Velocidade da voz">⚡ ' + (estado.vozVel || 1) + 'x</button>';
      cab.appendChild(wrap);

      const btn = wrap.querySelector(".ouvir-btn");
      const parar = wrap.querySelector(".ouvir-parar");
      const vel = wrap.querySelector(".ouvir-vel");

      vel.addEventListener("click", () => {
        const i = VOZ_VELOCIDADES.indexOf(estado.vozVel || 1);
        estado.vozVel = VOZ_VELOCIDADES[(i + 1) % VOZ_VELOCIDADES.length];
        salvar();
        document.querySelectorAll(".ouvir-vel").forEach((b) => { b.textContent = "⚡ " + estado.vozVel + "x"; });
        avisar("Velocidade da voz: " + estado.vozVel + "x");
        // se estiver lendo, aplica já na próxima frase reiniciando a fala atual
        if (leitura.estado === "falando") {
          const retomarIdx = leitura.idx;
          sintese.cancel();
          leitura.idx = retomarIdx;
          falarProxima();
        }
      });

      btn.addEventListener("click", () => {
        // tocando ESTA etapa: alterna pausa/continua
        if (leitura.btn === btn && leitura.estado === "falando") {
          sintese.pause();
          leitura.estado = "pausado";
          atualizarBotaoLeitura();
          return;
        }
        if (leitura.btn === btn && leitura.estado === "pausado") {
          sintese.resume();
          leitura.estado = "falando";
          atualizarBotaoLeitura();
          return;
        }
        // começa a ler esta etapa (parando qualquer outra)
        pararLeitura();
        leitura.btn = btn;
        leitura.parar = parar;
        leitura.fila = quebrarEmFrases(NARRACAO[secao.dataset.modulo] || textoDaEtapa(secao));
        leitura.idx = 0;
        leitura.estado = "falando";
        atualizarBotaoLeitura();
        falarProxima();
        avisar("🔊 Lendo em voz alta — dá para bloquear a tela e só ouvir!");
      });

      parar.addEventListener("click", pararLeitura);
    });
  }

  // contexto inicial: a vitrine de cursos
  if (!document.body.dataset.ctx) document.body.dataset.ctx = "catalogo";
  atualizarContinuar();
  atualizarTudo();

  /* ---------------- PWA: service worker + instalação ---------------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  // Captura o evento de instalação para avisar que dá para virar app
  let eventoInstalar = null;
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault();
    eventoInstalar = ev;
    avisar("📲 Dica: instale o curso como aplicativo no menu do navegador!");
  });
  window.addEventListener("appinstalled", () => {
    eventoInstalar = null;
    avisar("🎉 App instalado! Procure 'Academia Claude' na sua tela inicial.");
    festejar();
  });
})();
