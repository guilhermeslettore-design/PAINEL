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
    inicio: "Início", n1: "Nível 1 · Iniciante", n2: "Nível 2 · Intermediário",
    n3: "Nível 3 · Avançado", prompts: "Biblioteca de Prompts", jogo: "Jogo", final: "Certificado",
  };

  let estado = {
    feitos: {},
    quizes: {},
    jogo: { recorde: 0, passou: false },
    nome: "",
    ultimaTela: "",
    certComemorado: false,
  };

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
    document.querySelectorAll(".menu a").forEach((a) =>
      a.classList.toggle("ativo", a.dataset.nav === id)
    );
    document.querySelectorAll(".tabbar .tab").forEach((b) =>
      b.classList.toggle("ativo", b.dataset.nav === id)
    );
    menu.classList.remove("aberto");
    menuBtn.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    if (id !== "inicio") { estado.ultimaTela = id; salvar(); }
    atualizarContinuar();
  }

  function atualizarContinuar() {
    const btn = document.getElementById("continuarBtn");
    if (!btn) return;
    if (estado.ultimaTela && NOME_TELA[estado.ultimaTela]) {
      btn.classList.remove("oculto");
      btn.dataset.nav = estado.ultimaTela;
      btn.textContent = "▶ Continuar: " + NOME_TELA[estado.ultimaTela];
    } else {
      btn.classList.add("oculto");
    }
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
        prog.closest(".trilha-card").classList.toggle("completo", feitosNivel >= totalNivel);
      }
    });

    total += 1; if (estado.jogo.passou) feitos += 1;

    const pct = Math.round((feitos / total) * 100);
    const barraGeral = document.getElementById("barraGeral");
    const texto = document.getElementById("progressoTexto");
    if (barraGeral) barraGeral.style.width = pct + "%";
    if (texto) texto.textContent = pct + "%";
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
    ],
  };

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

    function telaInicio() {
      const info = estado.quizes[id];
      caixa.innerHTML = `
        <div class="quiz-inicio">
          <p>São <strong>${perguntas.length} perguntas</strong> de múltipla escolha.
          Acerte <strong>70% ou mais</strong> para concluir esta etapa. Sem tempo, sem pressão. 😉</p>
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
        ordem = embaralhar(perguntas);
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
  const TEMPO_MISSAO = 15; // segundos
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

      restante = TEMPO_MISSAO;
      elTimer.style.width = "100%";
      clearInterval(cronometro);
      cronometro = setInterval(() => {
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

  /* Certificado em imagem (canvas → PNG) */
  const certBaixarBtn = document.getElementById("certBaixarBtn");
  if (certBaixarBtn) {
    certBaixarBtn.addEventListener("click", () => {
      const c = document.createElement("canvas");
      c.width = 1200; c.height = 850;
      const g = c.getContext("2d");

      // fundo
      const grad = g.createLinearGradient(0, 0, 1200, 850);
      grad.addColorStop(0, "#221E1A");
      grad.addColorStop(1, "#1A1714");
      g.fillStyle = grad;
      g.fillRect(0, 0, 1200, 850);

      // brilho terracota
      const halo = g.createRadialGradient(950, 80, 30, 950, 80, 500);
      halo.addColorStop(0, "rgba(232,130,90,.22)");
      halo.addColorStop(1, "rgba(232,130,90,0)");
      g.fillStyle = halo;
      g.fillRect(0, 0, 1200, 850);

      // moldura dupla
      g.strokeStyle = "#E8825A"; g.lineWidth = 6;
      g.strokeRect(40, 40, 1120, 770);
      g.strokeStyle = "rgba(232,130,90,.35)"; g.lineWidth = 2;
      g.strokeRect(58, 58, 1084, 734);

      g.textAlign = "center";
      g.fillStyle = "#F2A05E";
      g.font = "700 26px Outfit, sans-serif";
      g.fillText("✳  ACADEMIA CLAUDE", 600, 140);

      g.fillStyle = "#B8AC9B";
      g.font = "22px Outfit, sans-serif";
      g.fillText("CERTIFICADO DE CONCLUSÃO", 600, 185);

      g.fillStyle = "#F2EBE0";
      g.font = "italic 600 64px Fraunces, Georgia, serif";
      g.fillText(estado.nome || "Aluno(a) da Academia", 600, 320);

      g.fillStyle = "#B8AC9B";
      g.font = "26px Outfit, sans-serif";
      g.fillText("concluiu o curso", 600, 390);

      g.fillStyle = "#F2EBE0";
      g.font = "600 34px Fraunces, Georgia, serif";
      g.fillText("“Domine o Claude — do zero ao avançado”", 600, 445);

      g.fillStyle = "#B8AC9B";
      g.font = "22px Outfit, sans-serif";
      g.fillText("Modelos · Projetos · Artifacts · Conectores MCP · Claude Code · API · Agentes", 600, 505);

      const data = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      g.fillText(`Concluído em ${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`, 600, 580);

      g.fillStyle = "#E8825A";
      g.font = "700 24px Outfit, sans-serif";
      g.fillText("🌱 Iniciante   ·   🚀 Intermediário   ·   🧠 Avançado   ·   🎮 Desafio final", 600, 660);

      g.fillStyle = "rgba(184,172,155,.7)";
      g.font = "16px Outfit, sans-serif";
      g.fillText("Curso independente, sem vínculo oficial com a Anthropic", 600, 760);

      const link = document.createElement("a");
      link.download = "certificado-academia-claude.png";
      link.href = c.toDataURL("image/png");
      link.click();
      avisar("🏆 Certificado baixado!");
    });
  }

  /* ---------------- Atualização geral ---------------- */
  function atualizarTudo() {
    atualizarModulos();
    atualizarProgresso();
    atualizarCertificado();
  }

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
