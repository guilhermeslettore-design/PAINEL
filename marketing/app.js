/* ============================================================
   APRENDE AÍ — Curso: Marketing Digital na Prática
   Mesmo molde padronizado do curso do Claude (engine idêntica):
   navegação, progresso, missões, voz, quizzes, jogos, tutor,
   kit de modelos, modo terceira idade e certificado.
   ============================================================ */
(function () {
  "use strict";

  const CHAVE = "aprendeai.marketing.v1";

  const MODULOS = {
    n1: ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5"],
    n2: ["m2-1", "m2-2", "m2-3", "m2-4", "m2-5", "m2-6"],
    n3: ["m3-1", "m3-2", "m3-3", "m3-4", "m3-5"],
  };
  const QUIZ_DO_NIVEL = { n1: "quiz1", n2: "quiz2", n3: "quiz3" };
  const NOME_TELA = {
    inicio: "Início do curso", n1: "Nível 1 · Fundamentos", n2: "Nível 2 · Conteúdo e Canais",
    n3: "Nível 3 · Tráfego pago", kit: "Kit de Marketing", tutor: "Tutor", jogo: "Jogos", final: "Certificado",
  };

  let estado = {
    feitos: {}, quizes: {}, missoes: {},
    jogo: { recorde: 0, passou: false },
    oficina: { melhor: 0, passou: false },
    desafio: { melhor: 0, passou: false },
    tutorHistorico: [],
    nome: "", ultimaTela: "", certComemorado: false,
    fonte: 16, senior: false, vozNome: "", vozVel: 1,
  };
  const VOZ_VELOCIDADES = [0.5, 1, 1.5, 2];

  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo === "object") estado = Object.assign(estado, salvo);
  } catch (e) {}
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} }

  /* ---------------- Toast e confete ---------------- */
  const toast = document.getElementById("toast");
  let toastTimer = null;
  function avisar(msg) {
    toast.textContent = msg;
    toast.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visivel"), 2200);
  }

  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  let confetes = [], confeteAnim = null;
  function festejar() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const cores = ["#E8825A", "#F2A05E", "#7FB97F", "#7FA8D9", "#B79FE0", "#E8B05A"];
    for (let i = 0; i < 120; i++) confetes.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 2.2, vy: 2 + Math.random() * 3.5,
      tam: 5 + Math.random() * 6, cor: cores[(Math.random() * cores.length) | 0],
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
    });
    if (!confeteAnim) animarConfete();
  }
  function animarConfete() {
    confeteAnim = requestAnimationFrame(animarConfete);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetes.forEach((c) => {
      c.x += c.vx; c.y += c.vy; c.rot += c.vr;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.cor; ctx.fillRect(-c.tam / 2, -c.tam / 2, c.tam, c.tam * 0.6); ctx.restore();
    });
    confetes = confetes.filter((c) => c.y < canvas.height + 30);
    if (!confetes.length) { cancelAnimationFrame(confeteAnim); confeteAnim = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  /* ---------------- Copiar ---------------- */
  function copiarTexto(texto) {
    const fim = () => avisar("📋 Copiado! Adapte os [colchetes].");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(fim).catch(() => fallbackCopy(texto, fim));
    } else fallbackCopy(texto, fim);
  }
  function fallbackCopy(t, depois) {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); depois(); } catch (e) { avisar("Não consegui copiar 😕"); }
    document.body.removeChild(ta);
  }
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-copiar]");
    if (!btn) return;
    ev.stopPropagation();
    copiarTexto(btn.dataset.copiar);
  });

  /* ---------------- Navegação ---------------- */
  const telas = document.querySelectorAll("[data-tela]");
  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menuBtn");

  function mostrarTela(id) {
    telas.forEach((t) => t.classList.toggle("oculto", t.dataset.tela !== id));
    document.querySelectorAll(".menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.nav === id));
    document.querySelectorAll(".tabbar .tab").forEach((b) => b.classList.toggle("ativo", b.dataset.nav === id));
    menu.classList.remove("aberto");
    menuBtn.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    if (id !== "inicio") { estado.ultimaTela = id; salvar(); }
    atualizarContinuar();
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

  function atualizarContinuar() {
    const btn = document.getElementById("comecarCursoBtn");
    if (!btn) return;
    const niveis = ["n1", "n2", "n3"];
    let alvo = "n1", rotulo = "▶ Começar pelo Nível 1";
    const proximo = niveis.find((n) => !nivelCompleto(n));
    if (!proximo) { alvo = "final"; rotulo = "🏆 Ver meu certificado"; }
    else if (estado.ultimaTela && niveis.includes(estado.ultimaTela)) { alvo = estado.ultimaTela; rotulo = "▶ Continuar no " + NOME_TELA[alvo]; }
    else if (proximo !== "n1") { alvo = proximo; rotulo = "▶ Continuar no " + NOME_TELA[proximo]; }
    btn.dataset.nav = alvo; btn.textContent = rotulo;
  }

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
      const f = mods.filter((m) => estado.feitos[m]).length + (quiz && quiz.passou ? 1 : 0);
      const t = mods.length + 1;
      total += t; feitos += f;
      const barra = document.querySelector(`[data-barra-nivel="${nivel}"]`);
      if (barra) barra.style.width = (f / t) * 100 + "%";
      const prog = document.querySelector(`[data-prog-nivel="${nivel}"]`);
      if (prog) {
        prog.textContent = f >= t ? "✓ Nível completo!" : `${f}/${t} etapas`;
        const item = prog.closest(".roadmap-item");
        if (item) item.classList.toggle("completo", f >= t);
      }
    });
    total += 1; if (estado.jogo.passou) feitos += 1;
    const pct = Math.round((feitos / total) * 100);
    const bg = document.getElementById("barraGeral");
    const tx = document.getElementById("progressoTexto");
    if (bg) bg.style.width = pct + "%";
    if (tx) tx.textContent = pct + "%";
  }
  function atualizarModulos() {
    document.querySelectorAll("[data-concluir]").forEach((btn) => {
      const feito = !!estado.feitos[btn.dataset.concluir];
      btn.classList.toggle("feito", feito);
      btn.textContent = feito ? "✓ Etapa concluída" : "✓ Concluir etapa";
      const mod = btn.closest("[data-modulo]");
      if (mod) mod.classList.toggle("feito", feito);
    });
  }
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-concluir]");
    if (!btn) return;
    estado.feitos[btn.dataset.concluir] = !estado.feitos[btn.dataset.concluir];
    salvar(); atualizarTudo();
  });

  /* ============================================================
     MISSÕES PRÁTICAS
     ============================================================ */
  const MISSOES_PRATICAS = {
    "m1-1": [
      "Desenhe seu funil num papel: como um desconhecido te descobre hoje? Onde ele \"vaza\" antes de comprar?",
      "Olhe seus últimos 9 posts: quantos são só \"compre\"? Reequilibre para 80% valor / 20% venda.",
    ],
    "m1-2": [
      "Mande mensagem para 3 clientes: \"por que você me escolheu?\" — anote as palavras exatas.",
      "Leia 20 avaliações de um concorrente no Google e liste as 3 reclamações mais repetidas.",
    ],
    "m1-3": [
      "Escreva sua promessa em UMA frase específica (com número, prazo ou diferencial). Teste: serviria para o concorrente? Refaça.",
      "Colete 3 provas hoje: peça 1 depoimento, separe 1 antes/depois, conte um número seu (\"+X atendidos\").",
    ],
    "m1-4": [
      "Escolha SEU canal principal (onde sua persona está + o que você mantém toda semana) e escreva o porquê.",
    ],
    "m1-5": [
      "Calcule seu CAC do último mês: gasto com divulgação ÷ clientes novos.",
      "Estime seu LTV: ticket médio × quantas vezes um cliente compra no ano. Compare com o CAC.",
    ],
    "m2-1": [
      "Monte o calendário da próxima semana: 1 post educativo, 1 prova/bastidor, 1 com CTA. Agende tudo de uma vez.",
    ],
    "m2-2": [
      "Reescreva a legenda do seu último post usando PAS (problema → agitação → solução) + 1 CTA claro.",
      "Escreva 5 ganchos diferentes para o mesmo conteúdo e escolha o mais forte.",
    ],
    "m2-3": [
      "Reforme sua bio agora: o que faz + para quem / prova / CTA com link.",
      "Grave 1 reel de 15s com gancho no primeiro segundo e legenda na tela.",
    ],
    "m2-4": [
      "Ative o WhatsApp Business e monte seu catálogo com ao menos 5 itens com foto e preço.",
      "Crie uma lista de transmissão com seus melhores clientes e envie 1 oferta + 1 dica.",
    ],
    "m2-5": [
      "Crie/atualize seu Perfil da Empresa no Google: categoria, horário e 10+ fotos reais.",
      "Gere seu link de avaliação e peça para 5 clientes satisfeitos avaliarem HOJE.",
    ],
    "m2-6": [
      "Defina sua isca de captura (cupom, guia, sorteio) e comece a coletar contatos.",
      "Mande uma mensagem de reativação para 10 clientes sumidos: \"sentimos sua falta + benefício\".",
    ],
    "m3-1": [
      "Entre no Gerenciador de Anúncios (não no Impulsionar) e explore os objetivos de campanha.",
      "Crie 3 criativos diferentes para a MESMA oferta (mude só o gancho).",
    ],
    "m3-2": [
      "Pesquise no Google as 5 palavras que seu cliente usaria para te achar. Você aparece?",
      "Liste 10 palavras-chave NEGATIVAS para o seu negócio (grátis, vaga, curso...).",
    ],
    "m3-3": [
      "Desenhe sua esteira: isca → oferta de entrada → produto principal → upsell/recorrência.",
    ],
    "m3-4": [
      "Monte sua planilha-painel: gasto, alcance, cliques, contatos, vendas, CAC e ROAS por semana.",
    ],
    "m3-5": [
      "Use uma IA para gerar 20 ideias de conteúdo do seu nicho (dica: o curso Domine o Claude te ensina a extrair o máximo).",
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
        `<span class="missoes-titulo">🔥 Missões práticas — faça no seu negócio agora:</span>` +
        MISSOES_PRATICAS[mod].map((t, i) => {
          const id = `${mod}-x${i}`;
          return `<label class="missao"><input type="checkbox" data-missao="${id}" ${estado.missoes[id] ? "checked" : ""}><span>${t}</span></label>`;
        }).join("");
      secao.insertBefore(bloco, btn);
    });
  }
  document.addEventListener("change", (ev) => {
    const cb = ev.target.closest("[data-missao]");
    if (!cb) return;
    estado.missoes[cb.dataset.missao] = cb.checked;
    salvar();
    if (cb.checked) avisar("🔥 Missão cumprida! Marketing se aprende fazendo.");
  });
  injetarMissoes();

  /* ============================================================
     QUIZZES (19 por nível; sorteia 10)
     ============================================================ */
  const PERGUNTAS = {
    quiz1: [
      { p: "Qual é a ordem correta do funil?", o: ["Vender → Atrair → Convencer", "Atrair → Convencer → Vender → Reter", "Reter → Vender → Atrair", "Tanto faz"], c: 1, e: "Desconhecido → confiança → compra → recompra. Pular etapas é o erro nº 1." },
      { p: "Postar só 'compre, compre' para quem não te conhece falha porque…", o: ["Falta hashtag", "É conteúdo de fundo de funil para público de topo", "O Instagram pune links", "Vender é errado"], c: 1, e: "Quem não te conhece precisa de valor e prova antes da oferta." },
      { p: "Tráfego orgânico é…", o: ["Alcance pago", "Alcance gratuito (conteúdo, busca, indicação)", "Só e-mail", "Anúncio no Google"], c: 1, e: "Orgânico = você não paga pelo alcance. Mais lento, constrói audiência." },
      { p: "A maior vantagem do tráfego pago é…", o: ["Ser grátis", "Velocidade e escala previsíveis", "Não precisar de oferta", "Substituir o produto bom"], c: 1, e: "Pago acelera o que já funciona — não conserta oferta ruim." },
      { p: "Persona é…", o: ["Seu concorrente", "O retrato detalhado do cliente ideal (dores, desejos, objeções)", "Um tipo de anúncio", "O nome da empresa"], c: 1, e: "Quem fala com todo mundo não convence ninguém." },
      { p: "A melhor fonte para descobrir a 'dor' do cliente é…", o: ["Adivinhar", "As palavras dos próprios clientes e as avaliações dos concorrentes", "Copiar um guru", "A sua opinião"], c: 1, e: "Pesquisa real: converse com clientes e leia reviews — as frases deles viram sua copy." },
      { p: "Qual promessa está melhor posicionada?", o: ["\"Qualidade e compromisso\"", "\"Comida saudável e saborosa\"", "\"Marmita fit com 40g de proteína entregue até 11h\"", "\"O melhor da cidade\""], c: 2, e: "Específico vence genérico. Número + prazo + diferencial." },
      { p: "Se ao tampar a logo o texto serviria para qualquer concorrente, isso indica…", o: ["Bom posicionamento", "Falta de posicionamento", "Texto perfeito", "Erro de português"], c: 1, e: "Posicionamento é o que só VOCÊ pode afirmar." },
      { p: "Oferta é…", o: ["Só o preço", "Produto + facilidades + segurança (garantia, parcelas, bônus)", "Desconto sempre", "A logo"], c: 1, e: "A mesma coisa fica irresistível com garantia, facilidade e bônus." },
      { p: "A 'regra de ouro' dos canais é…", o: ["Estar em todas as redes já", "Dominar UM canal antes de abrir vários", "Só usar TikTok", "Trocar de canal toda semana"], c: 1, e: "Presença forte em 1 vence presença fraca em 4." },
      { p: "Para serviço local de urgência (chaveiro, encanador), o canal com intenção mais quente é…", o: ["Instagram", "Google (busca/Maps)", "TikTok", "E-mail"], c: 1, e: "No Google a pessoa JÁ está procurando — intenção máxima." },
      { p: "Qual é uma métrica de VAIDADE?", o: ["Conversão", "CAC", "Número de curtidas", "ROAS"], c: 2, e: "Curtida não paga boleto. Olhe conversão, CAC, LTV." },
      { p: "Gastou R$ 300 e conquistou 10 clientes novos. Seu CAC é…", o: ["R$ 3", "R$ 30", "R$ 300", "R$ 3.000"], c: 1, e: "CAC = gasto ÷ clientes novos = 300 ÷ 10 = R$ 30." },
      { p: "LTV significa…", o: ["O lucro de uma venda", "Quanto um cliente deixa com você ao longo do tempo", "O custo do anúncio", "O número de seguidores"], c: 1, e: "Cliente que volta 10x vale 10x. Por isso retenção é ouro." },
      { p: "Negócio saudável tem…", o: ["CAC maior que LTV", "LTV maior que CAC (ideal 3x+)", "CAC = LTV", "Nenhuma relação"], c: 1, e: "Se o cliente deixa muito mais do que custou, você pode acelerar." },
      { p: "No funil, 'meio' significa…", o: ["Vender com desconto", "Gerar confiança (prova, conteúdo útil, relacionamento)", "Aparecer pela 1ª vez", "Pós-venda"], c: 1, e: "Meio = convencer. Prova social e valor preparam a venda." },
      { p: "Salvamentos e compartilhamentos importam porque…", o: ["Enfeitam o perfil", "São os sinais mais fortes de conteúdo útil para o algoritmo", "Valem dinheiro direto", "Não importam"], c: 1, e: "'Útil o bastante para mandar a um amigo' é o padrão-ouro." },
      { p: "Qual ação melhora a CONVERSÃO (e não o alcance)?", o: ["Postar mais vezes", "Responder o WhatsApp em minutos e facilitar o pagamento", "Comprar seguidores", "Usar mais hashtags"], c: 1, e: "Conversão é fechar: velocidade de resposta e fricção zero." },
      { p: "Retenção é mais barata que aquisição porque…", o: ["Não é", "O cliente já te conhece e confia — não há custo de convencimento", "Cliente antigo paga mais caro", "É moda"], c: 1, e: "Vender de novo para quem já comprou dispensa o custo de gerar confiança." },
    ],
    quiz2: [
      { p: "A proporção saudável de conteúdo é…", o: ["100% venda", "80% valor / 20% venda", "50/50", "Só bastidores"], c: 1, e: "Valor constrói audiência; a venda colhe. 80/20." },
      { p: "Os 4 pilares de conteúdo são…", o: ["Vender, vender, vender e vender", "Educar, conectar, provar e vender", "Memes, dancinhas, sorteios e lives", "Foto, vídeo, texto e áudio"], c: 1, e: "Educa (salva), conecta (identifica), prova (confia), vende (caixa)." },
      { p: "O 'gancho' é…", o: ["A hashtag", "Os 3 primeiros segundos/primeira frase que prendem a atenção", "O link da bio", "O preço"], c: 1, e: "A primeira frase decide se a pessoa para ou rola o feed." },
      { p: "Na fórmula PAS, o A significa…", o: ["Alcance", "Agitação (aprofundar a dor antes da solução)", "Anúncio", "Audiência"], c: 1, e: "Problema → Agitação → Solução." },
      { p: "Qual copy está mais forte?", o: ["\"Promoção imperdível, venha conferir!\"", "\"Qualidade e excelência há 10 anos\"", "\"Sobrou marmita? 5 congeladas por R$ 89 — só 20 kits, chama no Whats\"", "\"Siga para mais dicas\""], c: 2, e: "Específico + escassez + CTA único = copy que vende." },
      { p: "Benefício (vs característica) é…", o: ["\"Tecido dry-fit\"", "\"Treina sem ficar ensopado\"", "\"500g\"", "\"Fabricado na China\""], c: 1, e: "Característica descreve o produto; benefício descreve a vida do cliente." },
      { p: "Quantos CTAs por peça?", o: ["Quantos couberem", "UM, claro e direto", "Nenhum, fica chato", "Três no mínimo"], c: 1, e: "Quem pede duas ações não recebe nenhuma." },
      { p: "A 1ª linha de uma bio que converte diz…", o: ["Uma frase motivacional", "O que você faz e para quem", "Seu signo", "\"Link na bio\""], c: 1, e: "Em 1 segundo o visitante entende se é para ele." },
      { p: "O motor de alcance para NÃO-seguidores no Instagram é…", o: ["Stories", "Reels", "Destaques", "Legenda longa"], c: 1, e: "Reels alcançam quem não te segue; stories falam com quem já segue." },
      { p: "Stories servem principalmente para…", o: ["Alcançar desconhecidos", "Relacionar e vender para quem JÁ te segue", "Rankear no Google", "Nada"], c: 1, e: "É onde acontece a conversa diária e a oferta do dia." },
      { p: "Sobre 'melhor horário de postar':", o: ["Decide tudo", "Importa pouco — consistência e gancho valem mais", "Só às 18h", "Só de madrugada"], c: 1, e: "Conteúdo bom e constante vence relógio mágico." },
      { p: "No WhatsApp, para mandar oferta a muitos clientes sem criar grupo, use…", o: ["Status", "Lista de transmissão", "Spam manual", "Stories"], c: 1, e: "Transmissão chega como mensagem individual — escala com cara de pessoal." },
      { p: "O recurso do WhatsApp Business que mostra produtos com foto e preço é…", o: ["Etiquetas", "Catálogo", "Enquete", "Comunidade"], c: 1, e: "Catálogo é sua vitrine dentro do app." },
      { p: "Responder rápido no WhatsApp importa porque…", o: ["Não importa", "Velocidade de resposta multiplica conversão — o lento perde para o concorrente", "O app pune lentos", "É educado apenas"], c: 1, e: "Cliente quente esfria em minutos." },
      { p: "Comprar lista de contatos e disparar em massa é…", o: ["Estratégia top", "Ilegal (LGPD) e queima seu número/marca", "Permitido aos domingos", "Grátis"], c: 1, e: "Consentimento é lei — e spam destrói confiança." },
      { p: "O Perfil da Empresa no Google serve para…", o: ["Anúncios pagos apenas", "Aparecer (grátis) na busca e no Maps para quem procura perto", "Substituir o site", "Nada em 2026"], c: 1, e: "Negócio local sem perfil completo é invisível na busca." },
      { p: "Sobre avaliações no Google:", o: ["Ignorar as ruins", "Pedir a clientes felizes (com link) e responder TODAS", "Comprar avaliações", "Só amigos podem avaliar"], c: 1, e: "Quantidade + nota + recência + respostas = ranking e confiança." },
      { p: "Por que lista de e-mail/contatos é 'patrimônio'?", o: ["Porque dá seguidores", "Porque é o único canal que o algoritmo não tira de você", "Porque é cara", "Porque é obrigatória"], c: 1, e: "Seguidor é terreno alugado; lista é sua." },
      { p: "Uma sequência de boas-vindas típica tem…", o: ["1 mensagem de venda agressiva", "3 mensagens: entrega+história, prova+conteúdo, oferta com prazo", "10 mensagens por dia", "Nenhuma mensagem"], c: 1, e: "Aquece a relação antes do pedido — e converte muito mais." },
    ],
    quiz3: [
      { p: "Impulsionar vs Gerenciador de Anúncios:", o: ["São iguais", "O Gerenciador dá objetivos, públicos e medição de verdade; o Impulsionar é limitado", "Impulsionar é mais profissional", "Gerenciador é pago, impulsionar grátis"], c: 1, e: "Profissional roda no Gerenciador." },
      { p: "Quer conversas no WhatsApp via anúncio. O objetivo da campanha deve ser…", o: ["Reconhecimento de marca", "Mensagens/engajamento no WhatsApp", "Visualização de vídeo", "Curtidas"], c: 1, e: "O algoritmo otimiza para o objetivo que você pede. Peça a coisa certa." },
      { p: "O que mais pesa no resultado de um anúncio?", o: ["A segmentação ultrafina", "O criativo (imagem/vídeo + gancho)", "A hora de publicar", "O nome da campanha"], c: 1, e: "Criativo é ~80% do jogo. Teste 3–4 por campanha." },
      { p: "CTR significa…", o: ["Custo total real", "% de quem viu e clicou", "Curtidas totais", "Conversões por região"], c: 1, e: "CTR baixo (≲1%) = criativo fraco: troque o gancho." },
      { p: "Julgar campanha com 1 dia de veiculação é…", o: ["Correto", "Precipitado — o algoritmo precisa de alguns dias de aprendizado", "Obrigatório", "Impossível"], c: 1, e: "Dê ~7 dias e orçamento de teste antes do veredito." },
      { p: "A grande diferença do Google Ads para a Meta é…", o: ["Preço fixo", "Você aparece para quem JÁ está procurando (intenção)", "Não tem diferença", "Só funciona para lojas"], c: 1, e: "Meta interrompe; Google atende a procura. Intenção alta converte mais." },
      { p: "Palavras-chave NEGATIVAS servem para…", o: ["Falar mal do concorrente", "Evitar pagar por cliques errados ('grátis', 'curso'…)", "Aumentar o alcance", "Nada"], c: 1, e: "Cada clique fora do perfil é dinheiro no lixo. Negative sem dó." },
      { p: "\"Advogado trabalhista consulta online\" vs \"advogado\":", o: ["A genérica é melhor", "A específica (cauda longa) converte mais e custa menos", "São iguais", "Nenhuma funciona"], c: 1, e: "Cauda longa = intenção mais clara e menos concorrência." },
      { p: "Remarketing é…", o: ["Anunciar para estranhos", "Anunciar para quem já demonstrou interesse (visitou, viu vídeo, seguiu)", "Reenviar e-mails", "Trocar a logo"], c: 1, e: "O anúncio mais barato e com maior conversão: a pessoa só precisava de um empurrão." },
      { p: "Cerca de quantos visitantes NÃO compram na primeira visita?", o: ["10%", "50%", "97%", "0%"], c: 2, e: "Por isso captura de contato + remarketing são obrigatórios." },
      { p: "A esteira de ofertas saudável é…", o: ["Só produto caro", "Isca → entrada → principal → upsell/recorrência", "Só brindes", "Desconto eterno"], c: 1, e: "Cada degrau facilita o próximo e aumenta o LTV." },
      { p: "Faturou R$ 4.000 gastando R$ 1.000 em anúncios. ROAS =", o: ["0,25", "4", "40", "R$ 3.000"], c: 1, e: "ROAS = retorno ÷ gasto = 4000/1000 = 4." },
      { p: "ROAS 4 é bom?", o: ["Sempre", "Depende da margem: margem apertada exige ROAS maior", "Nunca", "ROAS não existe"], c: 1, e: "Sem margem na conta, ROAS engana. Faça a conta do lucro." },
      { p: "1.000 viram → 50 clicaram → 10 chamaram → 3 compraram. A etapa MAIS fraca é…", o: ["Anúncio (CTR 5%)", "Clique → contato (20%)", "Contato → venda (30%)", "Está tudo ótimo"], c: 1, e: "Analise etapa por etapa. 20% de clique→contato é onde está o vazamento maior aqui (página/oferta)." },
      { p: "Teste A/B correto:", o: ["Mudar tudo de uma vez", "Mudar UM elemento por vez", "Não testar", "Testar só uma vez na vida"], c: 1, e: "Mudou tudo junto? Não sabe o que causou o resultado." },
      { p: "Para escalar campanha vencedora…", o: ["Dobre o orçamento de uma vez", "Suba ~20% a cada poucos dias", "Pause tudo", "Mude o público inteiro"], c: 1, e: "Aumento gradual preserva o aprendizado do algoritmo." },
      { p: "Frequência 5 e CTR caindo indicam…", o: ["Sucesso", "Fadiga de criativo — renove o anúncio", "Hora de dobrar a verba", "Bug da plataforma"], c: 1, e: "Mesma pessoa vendo 5x e clicando menos = anúncio cansou." },
      { p: "Comprar seguidores…", o: ["Acelera o crescimento", "Afunda o alcance real e engana só você", "É exigência do Instagram", "Melhora o ROAS"], c: 1, e: "Engajamento falso destrói a entrega para o público verdadeiro." },
      { p: "Usar IA no marketing serve para…", o: ["Substituir a estratégia", "Multiplicar produção: ideias, variações de copy, análise de métricas", "Nada", "Só responder e-mail"], c: 1, e: "IA é o estagiário infinito — a estratégia continua sua. (Veja o curso Domine o Claude!)" },
    ],
  };
  const QUIZ_TAM = 10;

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
    const totalSorteado = Math.min(QUIZ_TAM, perguntas.length);
    let ordem = [], atual = 0, pontos = 0;

    function telaInicio() {
      const info = estado.quizes[id];
      caixa.innerHTML = `
        <div class="quiz-inicio">
          <p><strong>${totalSorteado} perguntas</strong> sorteadas de um banco de ${perguntas.length} — refazer traz perguntas novas! Acerte <strong>70%+</strong> para concluir. 😉</p>
          <button class="btn btn-primario" data-acao="comecar">Começar o quiz</button>
          ${info ? `<p class="quiz-recorde">Sua melhor nota: <strong>${info.melhor}%</strong>${info.passou ? " · ✅ etapa concluída" : ""}</p>` : ""}
        </div>`;
    }
    function telaPergunta() {
      const q = ordem[atual];
      const idx = embaralhar(q.o.map((_, i) => i));
      caixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo"><span>Pergunta ${atual + 1}/${ordem.length}</span><span>${pontos} acerto${pontos === 1 ? "" : "s"}</span></div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(atual / ordem.length) * 100}%"></div></div>
          <h3 class="quiz-pergunta">${q.p}</h3>
          <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-opcao="${i}">${q.o[i]}</button>`).join("")}</div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-acao="proxima">Próxima →</button>
        </div>`;
    }
    function responder(i) {
      const q = ordem[atual];
      if (i === q.c) pontos++;
      caixa.querySelectorAll(".quiz-opcao").forEach((b) => {
        b.disabled = true;
        const k = Number(b.dataset.opcao);
        if (k === q.c) b.classList.add("correta");
        else if (k === i) b.classList.add("errada");
      });
      const fb = caixa.querySelector(".quiz-feedback");
      fb.textContent = (i === q.c ? "✅ Acertou! " : "❌ Quase! ") + q.e;
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
      salvar(); atualizarTudo();
      if (passou) festejar();
      caixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${pct === 100 ? "🏆 Perfeito!" : passou ? "🎉 Mandou bem!" : "💪 Quase lá!"}</h3>
          <p class="quiz-nota">${pct}%</p>
          <p>${pontos} de ${ordem.length} certas. ${passou ? "Etapa concluída — siga em frente." : "Precisa de 70%. Releia as etapas e volte!"}</p>
          ${passou ? '<p class="quiz-selo">✅ Quiz aprovado</p>' : ""}
          <button class="btn btn-primario" data-acao="comecar" style="margin-top:.8rem">Tentar de novo</button>
        </div>`;
    }
    caixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-acao]");
      const op = ev.target.closest("[data-opcao]");
      if (acao && acao.dataset.acao === "comecar") { ordem = embaralhar(perguntas).slice(0, totalSorteado); atual = 0; pontos = 0; telaPergunta(); }
      else if (acao && acao.dataset.acao === "proxima") { atual++; if (atual < ordem.length) telaPergunta(); else telaFim(); }
      else if (op && !op.disabled) responder(Number(op.dataset.opcao));
    });
    telaInicio();
  }
  document.querySelectorAll(".quiz-caixa[data-quiz]").forEach(montarQuiz);

  /* ============================================================
     JOGO 1 — Decisão de Marketing
     ============================================================ */
  const MISSOES = [
    { t: "Restaurante novo, ninguém conhece, verba zero. Primeira jogada para aparecer para quem busca 'almoço perto de mim'?", r: "google", e: "Perfil da Empresa no Google: grátis e captura quem JÁ procura." },
    { t: "Sua agenda de sexta está vazia e você tem 200 clientes antigos no celular.", r: "relacionamento", e: "Lista de transmissão com oferta-relâmpago: o caixa mais rápido vem de quem já confia." },
    { t: "Oferta validada, lucrativa, e você quer dobrar o volume de pedidos este mês (tem verba).", r: "pago", e: "Oferta que já converte + verba = tráfego pago para escalar com previsibilidade." },
    { t: "Você é ótima no que faz, mas ninguém vê seu trabalho. Quer construir audiência sem gastar.", r: "organico", e: "Conteúdo orgânico (Reels mostrando o trabalho) constrói audiência e prova." },
    { t: "Cliente comprou 1 vez e some. Você quer que ele volte todo mês.", r: "relacionamento", e: "Retenção é relacionamento: WhatsApp/e-mail com cadência e benefício de recompra." },
    { t: "Lançou um produto inovador que NINGUÉM pesquisa no Google ainda.", r: "organico", e: "Sem busca não há intenção: crie demanda com conteúdo que educa e demonstra." },
    { t: "Seu site recebe visitas, mas 97% saem sem comprar.", r: "pago", e: "Remarketing: anunciar para quem já visitou é o clique mais barato e quente." },
    { t: "Dentista quer pacientes do bairro; concorrentes têm nota 4,8 e ele nem aparece no Maps.", r: "google", e: "Perfil completo + avaliações no Google: o jogo local se ganha aí." },
  ];
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
    let rodada = 0, pontos = 0, seq = 0, restante = TEMPO_MISSAO, cron = null, ordem = [];

    function mostrarRecorde() {
      const el = document.getElementById("jogoRecorde");
      if (estado.jogo.recorde > 0) el.textContent = `Seu recorde: ${estado.jogo.recorde} pts` + (estado.jogo.passou ? " · ✅ desafio concluído" : "");
    }
    mostrarRecorde();

    function iniciar() {
      ordem = embaralhar(MISSOES); rodada = 0; pontos = 0; seq = 0;
      jogoInicio.classList.add("oculto"); jogoFim.classList.add("oculto"); jogoRodada.classList.remove("oculto");
      proxima();
    }
    function proxima() {
      const m = ordem[rodada];
      elContador.textContent = `Situação ${rodada + 1}/${ordem.length}`;
      elPontos.textContent = `${pontos} pts`;
      elStreak.textContent = seq >= 2 ? `🔥 x${seq}` : "";
      elMissao.textContent = m.t;
      elFeedback.classList.add("oculto");
      escolhas.forEach((b) => { b.disabled = false; b.classList.remove("correta", "errada"); });
      TEMPO_MISSAO = tempoMissaoAtual();
      restante = TEMPO_MISSAO;
      elTimer.style.width = "100%";
      clearInterval(cron);
      const telaJogo = document.querySelector('[data-tela="jogo"]');
      cron = setInterval(() => {
        if (document.hidden || telaJogo.classList.contains("oculto")) return;
        restante -= 0.1;
        elTimer.style.width = Math.max(0, (restante / TEMPO_MISSAO) * 100) + "%";
        if (restante <= 0) { clearInterval(cron); responderJogo(null); }
      }, 100);
    }
    function responderJogo(canal) {
      clearInterval(cron);
      const m = ordem[rodada];
      const certo = canal === m.r;
      let ganho = 0, bonus = 0;
      if (certo) { seq++; ganho = Math.max(20, Math.round((restante / TEMPO_MISSAO) * 100)); bonus = Math.min(30, (seq - 1) * 10); pontos += ganho + bonus; }
      else seq = 0;
      elPontos.textContent = `${pontos} pts`;
      elStreak.textContent = seq >= 2 ? `🔥 x${seq}` : "";
      escolhas.forEach((b) => {
        b.disabled = true;
        if (b.dataset.modelo === m.r) b.classList.add("correta");
        else if (b.dataset.modelo === canal) b.classList.add("errada");
      });
      elFeedback.textContent = canal === null ? `⏰ Tempo! ${m.e}` :
        (certo ? `✅ Boa! +${ganho}${bonus ? ` (+${bonus} 🔥)` : ""} pts. ` : "❌ Não foi a melhor. ") + m.e;
      elFeedback.classList.remove("oculto");
      setTimeout(() => { rodada++; if (rodada < ordem.length) proxima(); else fim(); }, 2600);
    }
    function fim() {
      jogoRodada.classList.add("oculto"); jogoFim.classList.remove("oculto");
      const pct = Math.min(100, Math.round((pontos / PONTUACAO_MAXIMA) * 100));
      const passou = pct >= 50;
      estado.jogo.recorde = Math.max(estado.jogo.recorde, pontos);
      estado.jogo.passou = estado.jogo.passou || passou;
      salvar(); atualizarTudo();
      if (passou) festejar();
      document.getElementById("jogoResultadoTitulo").textContent = pct >= 85 ? "🏆 Estrategista de elite!" : passou ? "🎉 Decisões certeiras!" : "💪 Revise os canais e volte!";
      document.getElementById("jogoNota").textContent = `${pontos} pts`;
      document.getElementById("jogoResultadoMsg").textContent = `Você fez ${pct}% da pontuação base. ` + (passou ? "Desafio concluído para o certificado! ✅" : "Alcance 50% para contar no certificado.");
      mostrarRecorde();
    }
    document.getElementById("jogoComecar").addEventListener("click", iniciar);
    document.getElementById("jogoReiniciar").addEventListener("click", iniciar);
    escolhas.forEach((b) => b.addEventListener("click", () => { if (!b.disabled) responderJogo(b.dataset.modelo); }));
  }

  /* ============================================================
     JOGO 2 — Oficina de Copy
     ============================================================ */
  const OFICINA = [
    { c: "Anúncio de marmitas fit.", f: "\"Comida saudável e saborosa. Peça já!\"",
      o: ["\"Almoço resolvido: marmita com 40g de proteína na sua mesa até 11h. Cardápio no Whats 👉\"", "\"A melhor comida da cidade, qualidade e compromisso!\"", "\"Você sabia que comer bem é importante? Siga para mais dicas.\""],
      r: 0, e: "Benefício concreto + número + prazo + CTA único. 'Qualidade' é o que todo mundo diz." },
    { c: "Bio do Instagram de uma manicure.", f: "\"Amante de unhas 💅 Sonhadora ✨\"",
      o: ["\"Vivendo um dia de cada vez 🌸\"", "\"Unhas em gel no Centro de Niterói 💅 +800 clientes • Agende aqui 👇\"", "\"Manicure. Link na bio.\""],
      r: 1, e: "O que faz + onde + prova + CTA. Em 1 segundo a visitante sabe se é pra ela." },
    { c: "Gancho de um reel sobre erro em anúncios.", f: "\"Oi gente, hoje vou falar um pouquinho sobre anúncios...\"",
      o: ["\"Fala pessoal, mais um vídeo!\"", "\"Antes de começar, segue o perfil!\"", "\"Você está pagando 3x mais caro por clique — e a culpa é de UMA configuração.\""],
      r: 2, e: "Gancho com dor + curiosidade no primeiro segundo. Pedir follow antes de dar valor espanta." },
    { c: "Mensagem de reativação para cliente sumido.", f: "\"Olá! Tudo bem? Estamos com promoções!\"",
      o: ["\"Oi Ana, sentimos sua falta! 💛 Seu corte com 20% off até sexta — respondo aqui mesmo pra agendar.\"", "\"PROMOÇÃO IMPERDÍVEL!!! APROVEITE!!!\"", "\"Olá, somos da Beleza Hair, fundada em 2015, com missão de...\""],
      r: 0, e: "Nome + emoção + benefício claro + prazo + caminho fácil. Ninguém lê institucional no Whats." },
    { c: "Título de anúncio no Google para encanador.", f: "\"Serviços hidráulicos em geral\"",
      o: ["\"Encanador 24h na Zona Sul — chega em 40min\"", "\"Empresa de soluções hidráulicas\"", "\"O melhor encanador do Brasil\""],
      r: 0, e: "Urgência + região + prazo: espelha exatamente o que a pessoa desesperada buscou." },
    { c: "CTA de um post com oferta.", f: "\"Qualquer coisa estamos à disposição!\"",
      o: ["\"Curte, comenta, compartilha, salva e manda pra geral!\"", "\"Quero! 👉 Chama no WhatsApp (link na bio) — só 10 vagas\"", "\"Estamos à disposição para maiores informações.\""],
      r: 1, e: "UMA ação clara + escassez real. Pedir 5 ações = nenhuma ação." },
    { c: "Oferta de um curso de violão.", f: "\"Aulas de violão. Aprenda música!\"",
      o: ["\"Aulas de violão para todas as idades.\"", "\"Toque sua 1ª música em 30 dias — 1ª aula grátis e garantia de 7 dias\"", "\"Música é vida! Venha fazer aula!\""],
      r: 1, e: "Resultado + prazo + entrada sem risco (aula grátis + garantia): oferta, não descrição." },
    { c: "Post de prova social de uma clínica.", f: "\"Nossos pacientes amam nosso atendimento!\"",
      o: ["\"Somos referência em atendimento humanizado.\"", "\"Atendimento 5 estrelas, confira!\"", "\"'Sai sem dor no mesmo dia' — veja o depoimento da Júlia, que adiou o dentista por 3 anos 👇\""],
      r: 2, e: "Prova específica com história real vale mais que autoelogio genérico." },
  ];
  const oficinaCaixa = document.getElementById("oficinaCaixa");
  if (oficinaCaixa) {
    let ofOrdem = [], ofAtual = 0, ofPontos = 0;
    function ofInicio() {
      const info = estado.oficina;
      oficinaCaixa.innerHTML = `
        <div class="quiz-inicio">
          <p><strong>${OFICINA.length} rodadas</strong>: um texto fraco e 3 versões — toque na que vende mais. Acerte <strong>6+</strong> para o selo de Copywriter. ✍️</p>
          <button class="btn btn-primario" data-of="comecar">Começar a oficina</button>
          ${info.melhor ? `<p class="quiz-recorde">Recorde: <strong>${info.melhor}/${OFICINA.length}</strong>${info.passou ? " · ✅ selo conquistado" : ""}</p>` : ""}
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
          <p class="oficina-fraco">Texto fraco: <em>${q.f}</em></p>
          <h3 class="quiz-pergunta" style="font-size:1rem">Qual versão vende mais?</h3>
          <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-of-op="${i}">${q.o[i]}</button>`).join("")}</div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-of="proxima">Próxima →</button>
        </div>`;
    }
    function ofResponder(i) {
      const q = ofOrdem[ofAtual];
      if (i === q.r) ofPontos++;
      oficinaCaixa.querySelectorAll("[data-of-op]").forEach((b) => {
        b.disabled = true;
        const k = Number(b.dataset.ofOp);
        if (k === q.r) b.classList.add("correta");
        else if (k === i) b.classList.add("errada");
      });
      const fb = oficinaCaixa.querySelector(".quiz-feedback");
      fb.textContent = (i === q.r ? "✅ Boa! " : "❌ Quase. ") + q.e;
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
          <h3>${ofPontos === OFICINA.length ? "🏆 Copy de mestre!" : passou ? "✍️ Selo de Copywriter!" : "💪 Releia a etapa de copy e volte!"}</h3>
          <p class="quiz-nota">${ofPontos}/${OFICINA.length}</p>
          <p>${passou ? "Você já escreve para vender. Aplique em TODO post e anúncio." : "Acerte 6 para o selo."}</p>
          ${passou ? '<p class="quiz-selo">✍️ Copywriter</p>' : ""}
          <button class="btn btn-primario" data-of="comecar" style="margin-top:.8rem">Jogar de novo</button>
        </div>`;
    }
    oficinaCaixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-of]");
      const op = ev.target.closest("[data-of-op]");
      if (acao && acao.dataset.of === "comecar") { ofOrdem = embaralhar(OFICINA); ofAtual = 0; ofPontos = 0; ofRodada(); }
      else if (acao && acao.dataset.of === "proxima") { ofAtual++; if (ofAtual < ofOrdem.length) ofRodada(); else ofFim(); }
      else if (op && !op.disabled) ofResponder(Number(op.dataset.ofOp));
    });
    ofInicio();
  }

  /* ============================================================
     DESAFIO MESTRE — difícil de verdade
     ============================================================ */
  const DESAFIO = [
    { p: "Produto de R$ 100 com margem bruta de 25%. Qual ROAS apenas EMPATA o custo do anúncio?", o: ["1", "2,5", "4", "10"], c: 2,
      e: "Margem de 25% → lucro de R$ 25 por R$ 100 vendidos. Para o anúncio se pagar: faturamento ÷ gasto = 100/25 = ROAS 4. Abaixo disso, prejuízo." },
    { p: "CAC de R$ 80, ticket de R$ 60, e o cliente compra em média 5 vezes. Esse negócio…", o: ["Dá prejuízo: CAC > ticket", "É saudável: LTV de R$ 300 paga o CAC com folga", "É impossível avaliar", "Precisa baixar o ticket"], c: 1,
      e: "Olhar só a 1ª venda engana: LTV = 60×5 = R$ 300 vs CAC R$ 80 (3,75x). Negócios de recompra podem 'perder' na primeira venda." },
    { p: "Campanha com CTR alto (3%) e MUITOS cliques, mas zero vendas. O suspeito nº 1 é…", o: ["O criativo (anúncio)", "A página/oferta depois do clique", "O horário", "O Instagram caiu"], c: 1,
      e: "CTR alto = anúncio funciona. Se clicam e não compram, o problema está depois do clique: página, preço, confiança, atrito." },
    { p: "Anúncio de 'mensagens no WhatsApp' gerando dezenas de conversas que não viram venda. Melhor PRIMEIRA ação:", o: ["Aumentar a verba", "Trocar de plataforma", "Qualificar: ajustar copy/criativo para filtrar curiosos e revisar o script de atendimento", "Desistir do tráfego pago"], c: 2,
      e: "Volume sem qualidade = atração errada ou atendimento fraco. Aumentar verba multiplicaria o problema." },
    { p: "Verba pequena (R$ 600/mês) e oferta NUNCA testada. O caminho mais sensato:", o: ["Campanha de marca para 'aquecer'", "Testar direto com campanha de conversão/mensagens na oferta", "Guardar até ter R$ 10 mil", "Impulsionar o post mais curtido"], c: 1,
      e: "Verba pequena pede objetivo de fundo de funil para validar a oferta logo. 'Marca' com verba mínima não move o ponteiro." },
    { p: "No Google Ads, sua campanha de 'consultoria financeira' recebe cliques de quem busca 'curso grátis de finanças'. A correção é…", o: ["Pausar a campanha", "Adicionar 'grátis' e 'curso' como palavras-chave negativas", "Aumentar o lance", "Trocar o título"], c: 1,
      e: "Negativar termos fora do perfil corta o desperdício na raiz." },
    { p: "Frequência 6, CTR caiu pela metade, CPM subiu. Diagnóstico:", o: ["Público saturou / fadiga de criativo — renove criativo ou público", "A campanha está ótima", "Bug do gerenciador", "Hora de dobrar a verba"], c: 0,
      e: "Mesmas pessoas vendo 6x e clicando menos = cansou. Renovar criativo costuma resolver antes de mexer no público." },
    { p: "Remarketing converte mais barato porque…", o: ["A plataforma dá desconto", "O público já te conhece — falta só o empurrão", "Usa menos dados", "É ilimitado"], c: 1,
      e: "Confiança já construída = menos convencimento a pagar. Por isso 'esquentar' público com conteúdo barateia a venda." },
    { p: "Teste A/B válido de criativo exige…", o: ["Trocar imagem, título e público juntos", "Mudar UM elemento, mesmo público/orçamento, e volume suficiente antes de julgar", "1 dia de teste", "Dois produtos diferentes"], c: 1,
      e: "Uma variável por vez + amostra suficiente. Senão o 'vencedor' é ruído." },
    { p: "Sua conta do Instagram (canal único de vendas) foi hackeada. A lição estrutural é…", o: ["Azar, recomece", "Nunca dependa de UM canal alugado: construa lista própria (WhatsApp/e-mail) desde o dia 1", "Processar a Meta resolve rápido", "Senha forte basta"], c: 1,
      e: "Plataforma é terreno alugado. Lista própria é o seguro do negócio." },
    { p: "1.000 visitas → 100 carrinhos (10%) → 20 checkouts (20%) → 18 pagos (90%). Onde está o MAIOR vazamento?", o: ["Visita → carrinho", "Carrinho → checkout", "Checkout → pagamento", "Não há vazamento"], c: 1,
      e: "80% abandonam entre carrinho e checkout — frete surpresa, cadastro longo, desconfiança. É a etapa a atacar." },
    { p: "ROAS 8 com R$ 50/dia. Você dobra para R$ 100/dia e o ROAS cai para 5. Isso é…", o: ["Fracasso: volte aos R$ 50", "Normal: escalar encarece o marginal; se ainda dá lucro, pode valer", "Impossível", "Erro de medição com certeza"], c: 1,
      e: "Escala alcança públicos menos quentes — ROAS cede. A pergunta certa: o LUCRO total subiu? ROAS 5 lucrativo com o dobro de volume pode ser melhor." },
    { p: "Promessa 'emagreça 10kg em 1 semana, garantido' é um problema porque…", o: ["É modesta demais", "É enganosa: fere o CDC, políticas de anúncio (saúde) e destrói confiança", "Falta emoji", "Promessas não importam"], c: 1,
      e: "Plataformas bloqueiam claims irreais de saúde e o Procon também. Especificidade sim; mentira não." },
    { p: "Mandar oferta por WhatsApp para uma lista comprada de 5.000 números…", o: ["É growth hacking esperto", "Viola a LGPD (sem consentimento) e derruba seu número por spam", "Funciona se for de madrugada", "É permitido 1x por mês"], c: 1,
      e: "Sem consentimento = ilegal + banimento. Lista se constrói com isca e permissão." },
    { p: "Conteúdo orgânico com alcance ótimo mas ZERO pedidos há meses. Falta provavelmente…", o: ["Postar mais", "Fundo de funil: oferta clara, CTA e caminho fácil de compra", "Mudar de nicho", "Comprar seguidores"], c: 1,
      e: "Audiência sem oferta é palco sem bilheteria. Os 20% de venda do 80/20 existem por isso." },
    { p: "Para medir se o anúncio gera venda no WhatsApp (sem site), o caminho prático é…", o: ["Impossível medir", "Perguntar 'como me achou?', usar cupom/código por campanha e contar conversas→vendas na ponta", "Confiar no achismo", "Olhar só curtidas"], c: 1,
      e: "Atribuição manual: código por campanha + registro simples no caixa. Medição imperfeita > nenhuma." },
  ];
  const desafioCaixa = document.getElementById("desafioCaixa");
  if (desafioCaixa) {
    const N = Math.min(12, DESAFIO.length);
    let dOrdem = [], dAtual = 0, dPontos = 0;
    function dInicio() {
      const info = estado.desafio;
      desafioCaixa.innerHTML = `
        <div class="quiz-inicio">
          <p><strong>${N} perguntas difíceis</strong> de um banco de ${DESAFIO.length}: contas de ROAS/CAC, diagnósticos de campanha e pegadinhas. Acerte <strong>80%+</strong> (${Math.ceil(N * 0.8)}/${N}) para o título de Mestre. 🎓</p>
          <button class="btn btn-primario" data-d="comecar">Aceitar o desafio</button>
          ${info.melhor ? `<p class="quiz-recorde">Recorde: <strong>${info.melhor}%</strong>${info.passou ? " · 🎓 Mestre do Marketing" : ""}</p>` : ""}
        </div>`;
    }
    function dRodada() {
      const q = dOrdem[dAtual];
      const idx = embaralhar(q.o.map((_, i) => i));
      desafioCaixa.innerHTML = `
        <div class="quiz-jogo">
          <div class="quiz-topo"><span>Pergunta ${dAtual + 1}/${dOrdem.length}</span><span>${dPontos} acerto${dPontos === 1 ? "" : "s"}</span></div>
          <div class="barra barra-quiz"><div class="barra-fill" style="width:${(dAtual / dOrdem.length) * 100}%"></div></div>
          <h3 class="quiz-pergunta">${q.p}</h3>
          <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-d-op="${i}">${q.o[i]}</button>`).join("")}</div>
          <p class="quiz-feedback oculto"></p>
          <button class="btn btn-primario oculto" data-d="proxima">Próxima →</button>
        </div>`;
    }
    function dResponder(i) {
      const q = dOrdem[dAtual];
      if (i === q.c) dPontos++;
      desafioCaixa.querySelectorAll("[data-d-op]").forEach((b) => {
        b.disabled = true;
        const k = Number(b.dataset.dOp);
        if (k === q.c) b.classList.add("correta");
        else if (k === i) b.classList.add("errada");
      });
      const fb = desafioCaixa.querySelector(".quiz-feedback");
      fb.textContent = (i === q.c ? "✅ Acertou! " : "❌ Errou. ") + q.e;
      fb.classList.remove("oculto");
      const btn = desafioCaixa.querySelector('[data-d="proxima"]');
      btn.textContent = dAtual + 1 < dOrdem.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }
    function dFim() {
      const pct = Math.round((dPontos / dOrdem.length) * 100);
      const passou = pct >= 80;
      estado.desafio.melhor = Math.max(estado.desafio.melhor, pct);
      estado.desafio.passou = estado.desafio.passou || passou;
      salvar();
      if (passou) festejar();
      desafioCaixa.innerHTML = `
        <div class="quiz-fim">
          <h3>${pct === 100 ? "🏆 Gabaritou o impossível (de novo?!)" : passou ? "🎓 Mestre do Marketing!" : "💪 Esse derruba até gestor de tráfego."}</h3>
          <p class="quiz-nota">${dPontos}/${dOrdem.length}</p>
          <p>${passou ? "Título conquistado — você pensa como estrategista." : "As explicações de cada erro valem o curso inteiro. Tente de novo!"}</p>
          ${passou ? '<p class="quiz-selo">🎓 Mestre do Marketing</p>' : ""}
          <button class="btn btn-primario" data-d="comecar" style="margin-top:.8rem">Tentar de novo</button>
        </div>`;
    }
    desafioCaixa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-d]");
      const op = ev.target.closest("[data-d-op]");
      if (acao && acao.dataset.d === "comecar") { dOrdem = embaralhar(DESAFIO).slice(0, N); dAtual = 0; dPontos = 0; dRodada(); }
      else if (acao && acao.dataset.d === "proxima") { dAtual++; if (dAtual < dOrdem.length) dRodada(); else dFim(); }
      else if (op && !op.disabled) dResponder(Number(op.dataset.dOp));
    });
    dInicio();
  }

  /* ============================================================
     KIT DE MARKETING — modelos prontos
     ============================================================ */
  const KIT = [
    ["Conteúdo", "Calendário semanal mínimo", "SEGUNDA (educar): \"3 erros que [persona] comete ao [tema]\" • QUARTA (provar): depoimento/antes-e-depois + contexto • SEXTA (vender): oferta da semana com CTA \"chama no WhatsApp\" • STORIES diários: bastidor, enquete, caixinha de perguntas."],
    ["Conteúdo", "Roteiro de reel (15s)", "0-2s GANCHO: \"[Erro/segredo] que está te custando [dinheiro/tempo]\" • 3-10s CONTEÚDO: 3 passos rápidos com texto na tela • 11-15s CTA: \"Salva esse vídeo e me segue para [benefício]\"."],
    ["Conteúdo", "Bio que converte", "Linha 1: [O que você faz] para [quem] em [cidade] • Linha 2: [prova: +X clientes / desde 20XX / nota 4,9⭐] • Linha 3: [CTA] 👇 + link do WhatsApp/site."],
    ["Copy", "Fórmula PAS para post/anúncio", "PROBLEMA: \"[Pergunta sobre a dor]?\" • AGITAÇÃO: \"E o pior: [consequência de não resolver]...\" • SOLUÇÃO: \"[Produto] resolve com [diferencial]. [Prova]. [CTA com prazo/escassez].\""],
    ["Copy", "10 ganchos para testar", "1) Pare de [hábito comum] 2) O erro nº1 de quem [atividade] 3) Como [resultado] sem [dor] 4) [Número] sinais de que [problema] 5) Ninguém te conta isso sobre [tema] 6) Eu testei [coisa] por 30 dias 7) Antes de [ação], veja isso 8) [Mito] é mentira 9) Quanto custa [desejo]? 10) Faça isso HOJE se você [situação]."],
    ["WhatsApp", "Script de atendimento que fecha", "1) \"Oi, [nome]! Que bom te ver por aqui 😊\" 2) PERGUNTA: \"me conta: [pergunta de diagnóstico]?\" 3) SOLUÇÃO: opção A e B com preço claro 4) FECHO: \"posso reservar [dia/hora] pra você?\" 5) Se sumir 24h: \"oi [nome], guardei seu [item/horário] até [prazo] 😉\"."],
    ["WhatsApp", "Mensagem de lista (semanal)", "\"[Nome], [gancho curto da semana]! 🎯 [Oferta ou dica de valor em 2 linhas]. [CTA: responda EU QUERO / link]. Até [prazo]!\" — 80% das semanas valor, 20% oferta."],
    ["WhatsApp", "Reativação de sumidos", "\"Oi [nome], sentimos sua falta por aqui! 💛 Pra te dar um motivo de voltar: [benefício exclusivo] válido até [data]. Quer que eu já deixe reservado?\""],
    ["Google", "Checklist do Perfil da Empresa", "☐ Categoria principal certa ☐ Horários atualizados ☐ 15+ fotos reais (fachada, equipe, produto) ☐ Serviços/produtos cadastrados ☐ Link de avaliação enviado a todo cliente feliz ☐ TODAS as avaliações respondidas ☐ 1 post/oferta por semana no perfil."],
    ["E-mail", "Sequência de boas-vindas (3 e-mails)", "E-MAIL 1 (imediato): entrega da isca + sua história em 5 linhas • E-MAIL 2 (dia 2): melhor conteúdo + 2 depoimentos • E-MAIL 3 (dia 4): oferta de entrada com bônus e prazo de 48h."],
    ["Anúncios", "Checklist antes de publicar", "☐ Objetivo = ação que quero (mensagem/venda) ☐ 3-4 criativos diferentes ☐ Gancho forte no 1º segundo ☐ Página/Whats entrega o prometido ☐ Verba de teste definida (R$20-50/dia × 7 dias) ☐ Sei qual métrica decide (custo por contato/venda) ☐ Palavras negativas (Google)."],
    ["Anúncios", "Painel semanal de métricas", "Anote toda segunda: GASTO | ALCANCE | CLIQUES (CTR) | CONTATOS | VENDAS | CAC (gasto÷clientes) | ROAS (faturado÷gasto). Regra: decisão só com dados da SEMANA, não do dia."],
  ];
  const kitGrade = document.getElementById("kitGrade");
  const kitFiltros = document.getElementById("kitFiltros");
  if (kitGrade && kitFiltros) {
    const cats = ["Todos"].concat([...new Set(KIT.map((k) => k[0]))]);
    kitFiltros.innerHTML = cats.map((c, i) => `<button class="area-btn ${i === 0 ? "ativo" : ""}" data-cat="${c}">${c}</button>`).join("");
    function render(cat) {
      const lista = cat === "Todos" ? KIT : KIT.filter((k) => k[0] === cat);
      kitGrade.innerHTML = lista.map(([categoria, titulo, texto]) => `
        <div class="prompt-card">
          <div class="prompt-card-topo"><h5>${titulo}</h5><span class="prompt-card-cat">${categoria}</span></div>
          <p class="prompt-card-texto">${texto}</p>
          <button class="btn-copiar" data-copiar="${texto.replace(/"/g, "&quot;")}">📋 copiar</button>
        </div>`).join("");
    }
    kitFiltros.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-cat]");
      if (!b) return;
      kitFiltros.querySelectorAll(".area-btn").forEach((x) => x.classList.remove("ativo"));
      b.classList.add("ativo");
      render(b.dataset.cat);
    });
    render("Todos");
  }

  /* ============================================================
     TUTOR — base de conhecimento local
     ============================================================ */
  const KB = [
    { k: ["funil", "topo", "fundo de funil", "etapas da venda"], t: "Funil", a: "Funil é o caminho do desconhecido até cliente fiel: Atrair (topo) → Convencer (meio: prova e valor) → Vender (fundo: oferta e facilidade) → Reter (pós: recompra e indicação). O erro clássico é vender para quem ainda nem te conhece." },
    { k: ["persona", "cliente ideal", "publico alvo"], t: "Persona", a: "É o retrato do seu cliente ideal: quem é, qual dor tira o sono dele, o que deseja, por que NÃO compraria (objeções) e onde ele está. Descubra conversando com seus 5 melhores clientes e lendo avaliações de concorrentes — use as palavras DELES na sua copy." },
    { k: ["posicionamento", "diferencial", "concorrente"], t: "Posicionamento", a: "É a resposta a 'por que comprar de VOCÊ?'. Construa com promessa específica (número/prazo/diferencial), 1-2 diferenciais verdadeiros e prova (depoimentos, números). Teste: se o texto serve para o concorrente, não é posicionamento." },
    { k: ["oferta", "garantia", "bonus", "irresistivel"], t: "Oferta", a: "Oferta não é só o produto: é produto + facilidades + segurança. Turbine com garantia (7 dias), parcelamento, bônus, entrega grátis acima de X, 'experimente antes'. A mesma coisa fica irresistível com risco reduzido." },
    { k: ["organico", "trafego organico", "alcance gratis"], t: "Orgânico vs pago", a: "Orgânico = alcance gratuito (conteúdo, busca, indicação): lento, mas constrói audiência e prova. Pago = alcance comprado: rápido e escalável, exige verba e oferta validada. Use orgânico para validar e pago para acelerar o que já funciona." },
    { k: ["cac", "custo de aquisicao"], t: "CAC", a: "Custo de Aquisição de Cliente = gasto com marketing ÷ clientes novos. Gastou R$300 e fez 10 clientes → CAC R$30. Compare sempre com o LTV: o negócio é saudável quando LTV ≥ 3× CAC." },
    { k: ["ltv", "lifetime", "valor do cliente"], t: "LTV", a: "É quanto um cliente deixa com você ao longo do tempo: ticket médio × compras por ano × anos. Cliente que volta vale muito mais — por isso retenção (WhatsApp, e-mail, mimo de aniversário) é a parte mais lucrativa do marketing." },
    { k: ["roas", "retorno", "quanto rendeu"], t: "ROAS", a: "Retorno sobre o gasto em anúncios = faturamento gerado ÷ valor gasto. Faturou R$4.000 com R$1.000 → ROAS 4. Atenção: o ROAS mínimo aceitável depende da sua MARGEM — margem de 25% exige ROAS 4 só para empatar." },
    { k: ["ctr", "cliques", "taxa de clique"], t: "CTR", a: "É a % de quem viu o anúncio e clicou. Abaixo de ~1% costuma indicar criativo/gancho fraco. CTR alto com zero vendas = problema DEPOIS do clique (página, oferta, atendimento)." },
    { k: ["cpm", "cpc", "custo por clique"], t: "CPM e CPC", a: "CPM = custo por mil impressões (quanto custa aparecer). CPC = custo por clique. São métricas de leitura — a que decide é o CUSTO POR RESULTADO (contato/venda) e o ROAS." },
    { k: ["copy", "copywriting", "texto que vende", "legenda"], t: "Copywriting", a: "Escrever para gerar ação: gancho nos 3 primeiros segundos, fórmula PAS (Problema → Agitação → Solução), especificidade (números, prazos), benefício em vez de característica e UM CTA claro por peça." },
    { k: ["gancho", "primeiros segundos", "hook"], t: "Gancho", a: "A primeira frase/segundo decide se a pessoa para ou rola. Use pergunta direta, número, quebra de expectativa ('Pare de postar todo dia') ou dor ('agenda vazia na segunda?'). Nunca comece com 'Oi gente, hoje vou falar...'" },
    { k: ["cta", "chamada para acao", "call to action"], t: "CTA", a: "Chamada para ação: diga exatamente o próximo passo ('Chama no WhatsApp 👉 link na bio'). Regra: UM CTA por peça — quem pede cinco ações não recebe nenhuma. Escassez real ('só 10 vagas', 'até sexta') aumenta resposta." },
    { k: ["bio", "perfil do instagram"], t: "Bio que converte", a: "Linha 1: o que você faz e para quem (+cidade se for local). Linha 2: prova ('+800 clientes', nota 4,9). Linha 3: CTA com link (WhatsApp). Nome de usuário pesquisável ajuda a ser encontrado." },
    { k: ["reels", "reel", "video curto", "alcance no instagram"], t: "Reels", a: "É o formato que alcança quem NÃO te segue. 7–30s, gancho no primeiro segundo, legenda na tela (muita gente vê sem som), 1 ideia por vídeo. Stories são para quem JÁ te segue; reels para crescer." },
    { k: ["stories", "story"], t: "Stories", a: "Relacionamento diário com quem já te segue: bastidores crus, enquetes, caixinha de perguntas, oferta do dia. É onde a venda acontece no 1:1. Constância vale mais que produção." },
    { k: ["hashtag", "horario de postar", "algoritmo"], t: "Hashtags, horário e algoritmo", a: "Hashtags hoje pesam pouco: 3–5 específicas bastam. 'Melhor horário' é mito perto de consistência + gancho forte. O algoritmo premia salvamentos e compartilhamentos: crie pensando 'isso merece ser enviado a um amigo?'." },
    { k: ["whatsapp", "lista de transmissao", "catalogo", "whatsapp business"], t: "WhatsApp Business", a: "Use o app Business (grátis): catálogo com fotos/preços, respostas rápidas, etiquetas, saudação/ausência. Lista de transmissão (não grupo!) manda oferta semanal com cara de mensagem pessoal. E responda RÁPIDO: minutos fecham venda." },
    { k: ["google", "perfil da empresa", "google meu negocio", "maps", "avaliacoes"], t: "Google / busca local", a: "Crie o Perfil da Empresa no Google (grátis): categoria certa, horários, 15+ fotos reais, serviços. Peça avaliação (com link) a todo cliente feliz e responda todas. Para negócio local, é o melhor retorno por hora investida." },
    { k: ["email", "e-mail", "newsletter", "lista propria", "isca"], t: "E-mail e lista própria", a: "Seguidor é terreno alugado; lista é patrimônio. Capture contatos com uma isca (cupom, guia, sorteio), rode a sequência de boas-vindas (3 mensagens) e mantenha 1 envio/semana com 80% valor / 20% oferta." },
    { k: ["meta ads", "anuncio no instagram", "impulsionar", "gerenciador", "facebook ads"], t: "Anúncios na Meta", a: "Use o Gerenciador de Anúncios (não o Impulsionar). Escolha o objetivo = ação desejada (mensagens, vendas). O criativo é ~80% do resultado: teste 3-4. Comece amplo, R$20-50/dia por 7 dias, e meça custo por resultado." },
    { k: ["google ads", "anuncio no google", "palavras chave", "negativas"], t: "Google Ads", a: "No Google você aparece para quem JÁ procura (intenção alta). Prefira palavras específicas/cauda longa, configure palavras-chave NEGATIVAS ('grátis', 'curso'...) e garanta que a página entrega o que o anúncio promete." },
    { k: ["remarketing", "retargeting", "quem visitou"], t: "Remarketing", a: "Anunciar para quem já demonstrou interesse (visitou o site, viu o vídeo, te segue). É o anúncio mais barato e com maior conversão — ~97% não compram na 1ª visita, e o remarketing vai buscá-los." },
    { k: ["teste a/b", "testar", "otimizar campanha", "escalar"], t: "Teste A/B e escala", a: "Mude UM elemento por vez (gancho OU imagem OU oferta) com volume suficiente. Para escalar campanha vencedora: +20% de verba a cada poucos dias. CTR caindo + frequência alta = fadiga: renove o criativo." },
    { k: ["lgpd", "spam", "comprar seguidores", "lista comprada", "etica"], t: "O que nunca fazer", a: "Não compre seguidores (afunda o alcance real), não dispare para lista comprada (LGPD + banimento), não faça promessa enganosa (Procon + bloqueio de anúncio) e nunca dependa de um canal só — construa lista própria." },
    { k: ["ia", "claude", "inteligencia artificial", "chatgpt"], t: "IA no marketing", a: "IA é seu estagiário infinito: 20 ideias de conteúdo em segundos, variações de copy para teste A/B, análise de métricas, simulação de objeções da persona. Aqui na plataforma tem o curso 'Domine o Claude' — os dois se multiplicam!" },
  ];
  const SUGESTOES = ["O que é ROAS?", "Como melhorar minha bio?", "Impulsionar ou Gerenciador?", "O que é remarketing?", "Como pedir avaliações no Google?", "O que postar na semana?", "O que é CAC e LTV?", "Como escrever um gancho?"];

  const chatMensagens = document.getElementById("chatMensagens");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatSugestoes = document.getElementById("chatSugestoes");
  let ultimoTema = null;

  function normalizar(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function buscarResposta(perg) {
    const p = " " + normalizar(perg) + " ";
    if (/\b(oi|ola|opa|bom dia|boa tarde|boa noite)\b/.test(p) && perg.length < 30)
      return "Oi! 👋 Sou o tutor de marketing. Pergunta qualquer coisa: funil, copy, Instagram, WhatsApp, Google, anúncios, métricas...";
    if (/\b(obrigad|valeu|show|top|massa)\b/.test(p) && perg.length < 40)
      return "Tamo junto! 😊 Agora vai aplicar — marketing se aprende no caixa, não no caderno.";
    let melhor = null, pts = 0;
    KB.forEach((item) => {
      let s = 0;
      item.k.forEach((kw) => { if (p.includes(normalizar(kw))) s += kw.split(" ").length * 2 + (kw.length > 8 ? 1 : 0); });
      if (s > pts) { pts = s; melhor = item; }
    });
    if (melhor && pts >= 2) { ultimoTema = melhor; return "💡 " + melhor.t + "\n\n" + melhor.a; }
    if (ultimoTema && perg.length < 30 && /\b(e |isso|ele|como assim|mais|exemplo)\b/.test(p))
      return "Sobre " + ultimoTema.t + ": " + ultimoTema.a;
    return "Hmm, essa não tenho na ponta da língua. 🤔 Tente outras palavras ou toque numa sugestão — domino: funil, persona, oferta, copy, Instagram, WhatsApp, Google, e-mail, Meta/Google Ads, ROAS/CAC/LTV, testes e LGPD.";
  }
  function addBolha(de, texto) {
    const div = document.createElement("div");
    div.className = "msg " + (de === "eu" ? "msg-eu" : "msg-ia");
    div.textContent = texto;
    chatMensagens.appendChild(div);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
  }
  function salvarMsg(de, t) {
    estado.tutorHistorico.push({ de, t });
    if (estado.tutorHistorico.length > 60) estado.tutorHistorico = estado.tutorHistorico.slice(-60);
    salvar();
  }
  function renderSugestoes() {
    chatSugestoes.innerHTML = embaralhar(SUGESTOES).slice(0, 4)
      .map((s) => `<button type="button" class="chip" data-sugestao="${s}">${s}</button>`).join("");
  }
  function enviarPergunta(p) {
    addBolha("eu", p); salvarMsg("eu", p);
    chatInput.value = "";
    setTimeout(() => {
      const r = buscarResposta(p);
      addBolha("ia", r); salvarMsg("ia", r);
      renderSugestoes();
    }, 350);
  }
  if (chatForm) {
    if (estado.tutorHistorico.length) estado.tutorHistorico.forEach((m) => addBolha(m.de, m.t));
    else {
      const bv = "Oi! 👋 Sou o tutor de Marketing da Aprende Aí. Pergunte QUALQUER coisa: funil, copy, Instagram, WhatsApp, Google, anúncios, ROAS, CAC... Toque numa sugestão ou escreva!";
      addBolha("ia", bv); salvarMsg("ia", bv);
    }
    renderSugestoes();
    chatForm.addEventListener("submit", (ev) => { ev.preventDefault(); const p = chatInput.value.trim(); if (p) enviarPergunta(p); });
    chatSugestoes.addEventListener("click", (ev) => { const b = ev.target.closest("[data-sugestao]"); if (b) enviarPergunta(b.dataset.sugestao); });
    document.getElementById("chatLimpar").addEventListener("click", () => {
      estado.tutorHistorico = []; salvar(); chatMensagens.innerHTML = ""; ultimoTema = null;
      const m = "Conversa limpa! 🧹 Pode perguntar de novo.";
      addBolha("ia", m); salvarMsg("ia", m);
    });
  }

  /* ============================================================
     CERTIFICADO (nome, data, imprimir, PDF, imagem)
     ============================================================ */
  function atualizarCertificado() {
    const checks = { n1: nivelCompleto("n1"), n2: nivelCompleto("n2"), n3: nivelCompleto("n3"), jogo: estado.jogo.passou };
    document.querySelectorAll("#finalChecklist [data-check]").forEach((li) => li.classList.toggle("ok", !!checks[li.dataset.check]));
    const tudo = Object.values(checks).every(Boolean);
    const cert = document.getElementById("certificado");
    const texto = document.getElementById("finalTexto");
    if (cert) cert.classList.toggle("oculto", !tudo);
    if (texto) texto.textContent = tudo ? "Parabéns! Você completou tudo. 👏" : "Complete tudo abaixo para liberar seu certificado:";
    const nome = document.getElementById("certNome");
    if (nome && estado.nome) nome.textContent = estado.nome;
    const dataEl = document.getElementById("certData");
    if (dataEl) {
      const d = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      dataEl.textContent = `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    }
    if (tudo && !estado.certComemorado) { estado.certComemorado = true; salvar(); festejar(); }
  }
  const certBtn = document.getElementById("certNomeBtn");
  if (certBtn) certBtn.addEventListener("click", () => {
    const nome = prompt("Digite seu nome para o certificado:");
    if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); }
  });
  const certImprimirBtn = document.getElementById("certImprimirBtn");
  if (certImprimirBtn) {
    certImprimirBtn.addEventListener("click", () => {
      if (!estado.nome) {
        const nome = prompt("Antes de imprimir, digite seu nome:");
        if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); }
      }
      document.body.classList.add("imprimindo-cert");
      window.print();
      setTimeout(() => document.body.classList.remove("imprimindo-cert"), 500);
    });
  }
  window.addEventListener("afterprint", () => document.body.classList.remove("imprimindo-cert"));

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
      halo.addColorStop(0, "rgba(232,176,90,.22)"); halo.addColorStop(1, "rgba(232,176,90,0)");
      g.fillStyle = halo; g.fillRect(0, 0, 1200, 850);
      g.strokeStyle = "#E8B05A"; g.lineWidth = 6; g.strokeRect(40, 40, 1120, 770);
      g.strokeStyle = "rgba(232,176,90,.35)"; g.lineWidth = 2; g.strokeRect(58, 58, 1084, 734);
      g.textAlign = "center";
      g.fillStyle = "#F2C25E"; g.font = "700 26px Outfit, sans-serif";
      g.fillText("✳  APRENDE AÍ", 600, 140);
      g.fillStyle = "#B8AC9B"; g.font = "22px Outfit, sans-serif";
      g.fillText("CERTIFICADO DE CONCLUSÃO", 600, 185);
      g.fillStyle = "#F2EBE0"; g.font = "italic 600 64px Fraunces, Georgia, serif";
      g.fillText(estado.nome || "Aluno(a)", 600, 320);
      g.fillStyle = "#B8AC9B"; g.font = "26px Outfit, sans-serif";
      g.fillText("concluiu o curso", 600, 390);
      g.fillStyle = "#F2EBE0"; g.font = "600 34px Fraunces, Georgia, serif";
      g.fillText("“Marketing Digital na Prática”", 600, 445);
      g.fillStyle = "#B8AC9B"; g.font = "22px Outfit, sans-serif";
      g.fillText("Funil · Posicionamento · Copy · Instagram · WhatsApp · Google · Tráfego pago · Métricas", 600, 505);
      const d = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      g.fillText(`Concluído em ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`, 600, 580);
      g.fillStyle = "#E8B05A"; g.font = "700 24px Outfit, sans-serif";
      g.fillText("🌱 Fundamentos   ·   🚀 Conteúdo e Canais   ·   🧠 Tráfego pago", 600, 660);
      g.fillStyle = "rgba(184,172,155,.7)"; g.font = "16px Outfit, sans-serif";
      g.fillText("Aprende Aí · plataforma de cursos independente", 600, 760);
      cb(c);
    });
  }
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
    const a = document.createElement("a");
    a.download = nome; a.href = href; a.click();
    if (revogar) setTimeout(() => URL.revokeObjectURL(href), 4000);
  }
  const certBaixarBtn = document.getElementById("certBaixarBtn");
  if (certBaixarBtn) certBaixarBtn.addEventListener("click", () => {
    desenharCertificado((c) => { baixarArquivo(c.toDataURL("image/png"), "certificado-marketing-aprende-ai.png"); avisar("🏆 Certificado (imagem) baixado!"); });
  });
  const certPdfBtn = document.getElementById("certPdfBtn");
  if (certPdfBtn) certPdfBtn.addEventListener("click", () => {
    if (!estado.nome) {
      const nome = prompt("Antes de baixar, digite seu nome:");
      if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); }
    }
    desenharCertificado((c) => {
      const url = URL.createObjectURL(canvasParaPDF(c));
      baixarArquivo(url, "certificado-marketing-aprende-ai.pdf", true);
      avisar("📄 Certificado em PDF baixado!");
    });
  });

  /* ============================================================
     ACESSIBILIDADE — fonte e Modo Terceira Idade
     ============================================================ */
  function aplicarFonte() { document.documentElement.style.fontSize = estado.fonte + "px"; }
  const fMenor = document.getElementById("fonteMenor");
  const fMaior = document.getElementById("fonteMaior");
  if (fMenor && fMaior) {
    fMenor.addEventListener("click", () => { estado.fonte = Math.max(14, estado.fonte - 1); aplicarFonte(); salvar(); });
    fMaior.addEventListener("click", () => { estado.fonte = Math.min(21, estado.fonte + 1); aplicarFonte(); salvar(); });
  }
  if (estado.fonte !== 16) aplicarFonte();

  const SENIOR_EXPLICACAO = {
    "m1-1": "<p><strong>Em palavras simples:</strong> marketing é o caminho para uma pessoa que não te conhece virar cliente. Primeiro ela te descobre, depois passa a confiar, depois compra — e, se for bem tratada, volta. Não adianta gritar \"compre!\" para quem nem sabe quem você é.</p>",
    "m1-2": "<p><strong>Em palavras simples:</strong> antes de divulgar, conheça bem para QUEM você vende: o que essa pessoa precisa, o que ela teme, onde ela passa o tempo. Pergunte aos seus clientes por que escolheram você — as respostas valem ouro.</p>",
    "m1-3": "<p><strong>Em palavras simples:</strong> diga claramente por que escolher VOCÊ. Em vez de \"qualidade e bom preço\" (todo mundo fala isso), diga algo concreto: \"entrego no mesmo dia\", \"30 anos de experiência\", \"garantia de 7 dias\". E mostre provas: depoimentos e fotos reais.</p>",
    "m1-4": "<p><strong>Em palavras simples:</strong> não precisa estar em todas as redes. Escolha UMA onde seus clientes estão (muitas vezes é o WhatsApp ou o Google) e faça bem feito toda semana. Melhor um canal forte do que quatro abandonados.</p>",
    "m1-5": "<p><strong>Em palavras simples:</strong> curtida não paga conta. O que importa: quantas pessoas viraram clientes e quanto custou trazer cada uma. Se um cliente custa R$ 30 para conquistar e deixa R$ 300 com você, o negócio vai bem.</p>",
    "m2-1": "<p><strong>Em palavras simples:</strong> nas redes, ajude antes de vender. A cada 10 publicações, 8 devem ensinar algo ou mostrar seu trabalho, e só 2 devem vender. Assim as pessoas confiam em você — e aí compram.</p>",
    "m2-2": "<p><strong>Em palavras simples:</strong> escrever para vender é ser claro e direto. Comece com algo que prenda a atenção, mostre que entende o problema da pessoa e diga exatamente o que ela deve fazer (\"chame no WhatsApp\"). Uma instrução por vez.</p>",
    "m2-3": "<p><strong>Em palavras simples:</strong> no Instagram, sua bio deve dizer em 1 linha o que você faz e para quem. Vídeos curtos mostram seu trabalho para gente nova; os stories conversam com quem já te segue. Constância vale mais que perfeição.</p>",
    "m2-4": "<p><strong>Em palavras simples:</strong> o WhatsApp é onde o Brasil compra. Use a versão \"Business\" (grátis): monte um catálogo com fotos e preços, responda rápido e mande novidades pela lista de transmissão para quem é cliente. Nunca compre listas de números.</p>",
    "m2-5": "<p><strong>Em palavras simples:</strong> quando alguém procura no Google \"costureira perto de mim\", quem aparece é quem tem o cadastro bem feito. Faça o seu (é grátis), coloque fotos e peça aos clientes satisfeitos para avaliarem. Isso traz cliente sem gastar nada.</p>",
    "m2-6": "<p><strong>Em palavras simples:</strong> é muito mais fácil vender de novo para quem já comprou. Guarde o contato dos clientes, mande uma mensagem por semana com algo útil ou uma oferta, e lembre dos aniversários. Cliente bem tratado volta e indica.</p>",
    "m3-1": "<p><strong>Em palavras simples:</strong> anunciar no Instagram/Facebook é pagar para aparecer. Comece com pouco (R$ 20 por dia), teste 3 anúncios diferentes e veja qual traz mais clientes. A foto/vídeo e a primeira frase são o que mais importa.</p>",
    "m3-2": "<p><strong>Em palavras simples:</strong> no Google, seu anúncio aparece para quem JÁ está procurando o que você vende — por isso funciona tão bem para serviços. Escolha bem as palavras e diga ao Google quais palavras NÃO servem (como \"grátis\").</p>",
    "m3-3": "<p><strong>Em palavras simples:</strong> quase ninguém compra na primeira visita. Por isso: ofereça algo gratuito para pegar o contato, facilite a primeira compra, e \"lembre\" quem visitou e não comprou com um novo anúncio. É assim que o anúncio se paga.</p>",
    "m3-4": "<p><strong>Em palavras simples:</strong> anote toda semana: quanto gastou, quantos contatos chegaram e quantas vendas saíram. Se o anúncio traz mais dinheiro do que custa, aumente aos poucos. Se não traz, troque o anúncio ou a oferta — sem dó.</p>",
    "m3-5": "<p><strong>Em palavras simples:</strong> a inteligência artificial ajuda a criar textos e ideias rapidinho (tem um curso disso aqui na plataforma!). E cuidado com atalhos: comprar seguidores, mandar mensagem para quem não pediu e prometer milagre só trazem prejuízo.</p>",
  };
  let seniorBoxes = [];
  function aplicarSenior() {
    document.body.classList.toggle("senior", estado.senior);
    const btn = document.getElementById("seniorBtn");
    if (btn) { btn.setAttribute("aria-pressed", String(estado.senior)); btn.classList.toggle("ativo", estado.senior); }
    if (estado.senior) {
      document.querySelectorAll(".modulo[data-modulo]").forEach((secao) => {
        const mod = secao.dataset.modulo;
        if (!SENIOR_EXPLICACAO[mod] || secao.querySelector(".senior-box")) return;
        const box = document.createElement("div");
        box.className = "senior-box";
        box.innerHTML = '<span class="senior-box-tag">👵 Explicação fácil</span>' + SENIOR_EXPLICACAO[mod];
        secao.querySelector(".modulo-cabecalho").insertAdjacentElement("afterend", box);
        seniorBoxes.push(box);
      });
    } else { seniorBoxes.forEach((b) => b.remove()); seniorBoxes = []; }
  }
  const seniorBtn = document.getElementById("seniorBtn");
  if (seniorBtn) seniorBtn.addEventListener("click", () => {
    estado.senior = !estado.senior;
    if (estado.senior && estado.fonte < 20) { estado.fonte = 20; aplicarFonte(); }
    if (!estado.senior && estado.fonte === 20) { estado.fonte = 16; aplicarFonte(); }
    salvar(); aplicarSenior();
    avisar(estado.senior ? "👵 Modo Terceira Idade ligado!" : "Modo normal de volta.");
  });
  if (estado.senior) aplicarSenior();

  /* ============================================================
     LEITURA EM VOZ ALTA (voz fixa + velocidades 0.5/1/1.5/2x)
     ============================================================ */
  const sintese = window.speechSynthesis;
  let leitura = { fila: [], idx: 0, btn: null, parar: null, estado: "parado" };
  let vozFixa = null;
  function vozPortugues() {
    if (vozFixa) return vozFixa;
    const vozes = (sintese ? sintese.getVoices() : []).filter((v) => /^pt([-_]|$)/i.test(v.lang));
    if (!vozes.length) return null;
    if (estado.vozNome) {
      const s = vozes.find((v) => v.name === estado.vozNome);
      if (s) { vozFixa = s; return s; }
    }
    const nota = (v) => {
      const n = v.name.toLowerCase();
      let s = 0;
      if (/br/i.test(v.lang)) s += 5;
      if (n.includes("google")) s += 4;
      if (/luciana|felipe|francisca|camila|thalita|antonio/.test(n)) s += 3;
      if (/natural|enhanced|premium|aprimorad|neural/.test(n)) s += 3;
      if (!v.localService) s += 1;
      return s;
    };
    vozFixa = vozes.sort((a, b) => nota(b) - nota(a) || a.name.localeCompare(b.name))[0];
    estado.vozNome = vozFixa.name; salvar();
    return vozFixa;
  }
  if (sintese) {
    sintese.getVoices();
    if (typeof sintese.addEventListener === "function")
      sintese.addEventListener("voiceschanged", () => { if (!vozFixa) vozPortugues(); });
  }
  function textoDaEtapa(secao) {
    const clone = secao.cloneNode(true);
    clone.querySelectorAll("pre, button, input, select, .quiz-caixa, .ouvir-controles").forEach((e) => e.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function quebrarEmFrases(texto) {
    const frases = texto.match(/[^.!?…]+[.!?…]*/g) || [texto];
    const fila = [];
    frases.forEach((f) => {
      f = f.trim();
      if (!f) return;
      while (f.length > 220) {
        const corte = f.lastIndexOf(",", 220);
        const p = corte > 60 ? f.slice(0, corte + 1) : f.slice(0, 220);
        fila.push(p.trim()); f = f.slice(p.length).trim();
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
    leitura.estado = "parado"; leitura.fila = []; leitura.idx = 0;
    atualizarBotaoLeitura();
    leitura.btn = null; leitura.parar = null;
  }
  function falarProxima() {
    if (leitura.idx >= leitura.fila.length) { leitura.estado = "parado"; atualizarBotaoLeitura(); return; }
    const u = new SpeechSynthesisUtterance(leitura.fila[leitura.idx]);
    u.lang = "pt-BR";
    const voz = vozPortugues();
    if (voz) u.voice = voz;
    u.rate = estado.vozVel || 1;
    u.pitch = 1.0;
    u.onend = () => { leitura.idx++; if (leitura.estado === "falando" || leitura.estado === "pausado") falarProxima(); };
    u.onerror = () => { leitura.idx++; if (leitura.estado !== "parado") falarProxima(); };
    sintese.speak(u);
  }
  if (sintese && "SpeechSynthesisUtterance" in window) {
    document.querySelectorAll(".modulo[data-modulo]").forEach((secao) => {
      if (secao.dataset.modulo.startsWith("quiz")) return;
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
        if (leitura.estado === "falando") {
          const idx = leitura.idx;
          sintese.cancel(); leitura.idx = idx; falarProxima();
        }
      });
      btn.addEventListener("click", () => {
        if (leitura.btn === btn && leitura.estado === "falando") { sintese.pause(); leitura.estado = "pausado"; atualizarBotaoLeitura(); return; }
        if (leitura.btn === btn && leitura.estado === "pausado") { sintese.resume(); leitura.estado = "falando"; atualizarBotaoLeitura(); return; }
        pararLeitura();
        leitura.btn = btn; leitura.parar = parar;
        leitura.fila = quebrarEmFrases(textoDaEtapa(secao));
        leitura.idx = 0; leitura.estado = "falando";
        atualizarBotaoLeitura();
        falarProxima();
        avisar("🔊 Lendo em voz alta — pode bloquear a tela e só ouvir!");
      });
      parar.addEventListener("click", pararLeitura);
    });
  }

  /* ---------------- Inicialização ---------------- */
  function atualizarTudo() {
    atualizarModulos();
    atualizarProgresso();
    atualizarCertificado();
  }
  atualizarContinuar();
  atualizarTudo();
})();
