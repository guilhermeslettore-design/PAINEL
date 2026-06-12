/* ============================================================
   ACADEMIA CLAUDE — lógica do curso
   Navegação · progresso (localStorage) · quizzes · jogo
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

  let estado = {
    feitos: {},            // {"m1-1": true, ...}
    quizes: {},            // {"quiz1": {melhor: 80, passou: true}}
    jogo: { recorde: 0, passou: false },
    nome: "",
  };

  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo === "object") estado = Object.assign(estado, salvo);
  } catch (e) { /* primeiro acesso */ }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
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
    menu.classList.remove("aberto");
    menuBtn.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
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

    // jogo conta no total geral
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
        <div class="area-prompt"><b>Prompt:</b> ${prompt}</div>
      </div>`
      )
      .join("");
  }
  document.querySelectorAll(".area-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".area-btn").forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      mostrarArea(btn.dataset.area);
    });
  });
  mostrarArea("vendas");

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
      { p: "Qual técnica melhora MUITO um prompt profissional?", o: ["Escrever tudo em maiúsculas", "Definir um papel/persona e mostrar exemplos", "Usar frases bem curtas sempre", "Repetir o pedido 3 vezes"], c: 1,
        e: "Persona + exemplos + formato definido = respostas no padrão que você precisa." },
      { p: "Para saber a cotação do dólar de hoje, o ideal é…", o: ["Perguntar direto, ele sempre sabe", "Ativar a pesquisa na web", "Usar o Haiku", "Criar um Projeto"], c: 1,
        e: "O conhecimento do modelo tem data de corte; para informação atual, use a pesquisa na web." },
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
      { p: "Um 'servidor MCP' é…", o: ["Um computador da Anthropic", "Um programa que expõe ferramentas/dados para a IA usar", "Um plano enterprise", "Um antivírus"], c: 1,
        e: "Servidores MCP oferecem ferramentas (ações) e recursos (dados); o Claude é o cliente que os consome." },
      { p: "O que é um 'agente' de IA?", o: ["Um funcionário da Anthropic", "Uma IA que executa um objetivo: planeja, usa ferramentas e verifica", "Um vírus", "Um atalho de teclado"], c: 1,
        e: "Agentes não só respondem: trabalham até concluir a tarefa, usando ferramentas e se auto-corrigindo." },
      { p: "Qual prática de segurança está ERRADA?", o: ["Revisar documentos importantes", "Colocar a chave da API dentro do código publicado", "Dar permissões mínimas aos conectores", "Conferir números gerados"], c: 1,
        e: "Chave de API é segredo: use variáveis de ambiente e nunca exponha no código." },
    ],
  };

  /* ---------------- Motor de quiz ---------------- */
  function montarQuiz(caixa) {
    const id = caixa.dataset.quiz;
    const perguntas = PERGUNTAS[id];
    let atual = 0, pontos = 0;

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
      const q = perguntas[atual];
      caixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo">
            <span>Pergunta ${atual + 1}/${perguntas.length}</span>
            <span>${pontos} acerto${pontos === 1 ? "" : "s"}</span>
          </div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(atual / perguntas.length) * 100}%"></div></div>
          <h3 class="quiz-pergunta">${q.p}</h3>
          <div class="quiz-opcoes">
            ${q.o.map((op, i) => `<button class="quiz-opcao" data-opcao="${i}">${op}</button>`).join("")}
          </div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-acao="proxima">Próxima →</button>
        </div>`;
    }

    function responder(i) {
      const q = perguntas[atual];
      const certo = i === q.c;
      if (certo) pontos++;
      caixa.querySelectorAll(".quiz-opcao").forEach((b, idx) => {
        b.disabled = true;
        if (idx === q.c) b.classList.add("correta");
        else if (idx === i) b.classList.add("errada");
      });
      const fb = caixa.querySelector(".quiz-feedback");
      fb.textContent = (certo ? "✅ Acertou! " : "❌ Quase! ") + q.e;
      fb.classList.remove("oculto");
      const btn = caixa.querySelector('[data-acao="proxima"]');
      btn.textContent = atual + 1 < perguntas.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }

    function telaFim() {
      const pct = Math.round((pontos / perguntas.length) * 100);
      const passou = pct >= 70;
      const info = estado.quizes[id] || { melhor: 0, passou: false };
      info.melhor = Math.max(info.melhor, pct);
      info.passou = info.passou || passou;
      estado.quizes[id] = info;
      salvar();
      atualizarTudo();

      const titulo = pct === 100 ? "🏆 Perfeito!" : passou ? "🎉 Mandou bem!" : "💪 Quase lá!";
      const msg = passou
        ? "Etapa de quiz concluída — pode seguir em frente."
        : "Você precisa de 70% para concluir. Releia as etapas e tente de novo!";
      caixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${titulo}</h3>
          <p class="quiz-nota">${pct}%</p>
          <p>${pontos} de ${perguntas.length} perguntas certas. ${msg}</p>
          ${passou ? '<p class="quiz-selo">✅ Quiz aprovado</p>' : ""}
          <button class="btn btn-primario" data-acao="comecar" style="margin-top:.8rem">Tentar de novo</button>
        </div>`;
    }

    caixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-acao]");
      const opcao = ev.target.closest("[data-opcao]");
      if (acao && acao.dataset.acao === "comecar") {
        atual = 0; pontos = 0; telaPergunta();
      } else if (acao && acao.dataset.acao === "proxima") {
        atual++;
        if (atual < perguntas.length) telaPergunta(); else telaFim();
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
    const escolhas = Array.from(document.querySelectorAll(".jogo-escolha"));

    let rodada = 0, pontos = 0, restante = TEMPO_MISSAO, cronometro = null, ordem = [];

    function mostrarRecorde() {
      const el = document.getElementById("jogoRecorde");
      if (estado.jogo.recorde > 0) {
        el.textContent = `Seu recorde: ${estado.jogo.recorde} pts` +
          (estado.jogo.passou ? " · ✅ desafio concluído" : "");
      }
    }
    mostrarRecorde();

    function embaralhar(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function iniciarJogo() {
      ordem = embaralhar(MISSOES);
      rodada = 0; pontos = 0;
      jogoInicio.classList.add("oculto");
      jogoFim.classList.add("oculto");
      jogoRodada.classList.remove("oculto");
      proximaMissao();
    }

    function proximaMissao() {
      const m = ordem[rodada];
      elContador.textContent = `Missão ${rodada + 1}/${ordem.length}`;
      elPontos.textContent = `${pontos} pts`;
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
      const ganho = certo ? Math.max(20, Math.round((restante / TEMPO_MISSAO) * 100)) : 0;
      pontos += ganho;
      elPontos.textContent = `${pontos} pts`;

      escolhas.forEach((b) => {
        b.disabled = true;
        if (b.dataset.modelo === m.r) b.classList.add("correta");
        else if (b.dataset.modelo === modelo) b.classList.add("errada");
      });

      elFeedback.textContent = modelo === null
        ? `⏰ Tempo esgotado! ${m.e}`
        : (certo ? `✅ Certo! +${ganho} pts. ` : "❌ Não foi dessa vez. ") + m.e;
      elFeedback.classList.remove("oculto");

      setTimeout(() => {
        rodada++;
        if (rodada < ordem.length) proximaMissao(); else fimDeJogo();
      }, 2600);
    }

    function fimDeJogo() {
      jogoRodada.classList.add("oculto");
      jogoFim.classList.remove("oculto");
      const pct = Math.round((pontos / PONTUACAO_MAXIMA) * 100);
      const passou = pct >= 50;

      estado.jogo.recorde = Math.max(estado.jogo.recorde, pontos);
      estado.jogo.passou = estado.jogo.passou || passou;
      salvar();
      atualizarTudo();

      document.getElementById("jogoResultadoTitulo").textContent =
        pct >= 85 ? "🏆 Gestor de IA lendário!" : passou ? "🎉 Missões cumpridas!" : "💪 Treine e volte!";
      document.getElementById("jogoNota").textContent = `${pontos} pts`;
      document.getElementById("jogoResultadoMsg").textContent =
        `Você fez ${pct}% da pontuação máxima (${PONTUACAO_MAXIMA} pts). ` +
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
      : "Complete tudo abaixo para liberar seu certificado simbólico:";
    const nome = document.getElementById("certNome");
    if (nome && estado.nome) nome.textContent = estado.nome;
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

  /* ---------------- Atualização geral ---------------- */
  function atualizarTudo() {
    atualizarModulos();
    atualizarProgresso();
    atualizarCertificado();
  }

  atualizarTudo();
})();
