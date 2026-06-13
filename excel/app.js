/* ============================================================
   IMPÉRIO DIGITAL — Curso: Excel do Zero ao Profissional
   Mesmo molde padronizado (engine idêntica aos outros cursos).
   ============================================================ */
(function () {
  "use strict";

  const CHAVE = "imperiodigital.excel.v1";

  const MODULOS = {
    n1: ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5"],
    n2: ["m2-1", "m2-2", "m2-3", "m2-4", "m2-5", "m2-6"],
    n3: ["m3-1", "m3-2", "m3-3", "m3-4", "m3-5"],
  };
  const QUIZ_DO_NIVEL = { n1: "quiz1", n2: "quiz2", n3: "quiz3" };
  const NOME_TELA = {
    inicio: "Início do curso", n1: "Nível 1 · Primeiros passos", n2: "Nível 2 · Fórmulas e Funções",
    n3: "Nível 3 · Análise e Profissional", kit: "Guia de Funções", tutor: "Tutor", jogo: "Jogos", final: "Certificado",
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
    toast.textContent = msg; toast.classList.add("visivel");
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
  window.confete = festejar;

  /* ---------------- Copiar ---------------- */
  function copiarTexto(texto) {
    const fim = () => avisar("📋 Copiado! Cole no Excel e ajuste os intervalos.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(fim).catch(() => fb(texto, fim));
    else fb(texto, fim);
  }
  function fb(t, depois) {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); depois(); } catch (e) { avisar("Não consegui copiar 😕"); }
    document.body.removeChild(ta);
  }
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-copiar]");
    if (!btn) return; ev.stopPropagation(); copiarTexto(btn.dataset.copiar);
  });

  /* ---------------- Navegação ---------------- */
  const telas = document.querySelectorAll("[data-tela]");
  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menuBtn");
  function mostrarTela(id) {
    telas.forEach((t) => t.classList.toggle("oculto", t.dataset.tela !== id));
    document.querySelectorAll(".menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.nav === id));
    document.querySelectorAll(".tabbar .tab").forEach((b) => b.classList.toggle("ativo", b.dataset.nav === id));
    menu.classList.remove("aberto"); menuBtn.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    if (id !== "inicio") { estado.ultimaTela = id; salvar(); }
    atualizarContinuar();
  }
  document.addEventListener("click", (ev) => {
    const alvo = ev.target.closest("[data-nav]");
    if (!alvo) return; ev.preventDefault();
    mostrarTela(alvo.dataset.nav); atualizarTudo();
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

  /* ============================================================ MISSÕES PRÁTICAS ============================================================ */
  const MISSOES_PRATICAS = {
    "m1-1": ["Abra o Excel, clique na célula B3 e confirme que a Caixa de Nome mostra 'B3'.", "Crie uma 2ª aba (botão +) e renomeie a primeira com duplo-clique."],
    "m1-2": ["Digite 100 numa célula e a palavra '100un' em outra: veja qual encosta na direita (número) e qual na esquerda (texto).", "Monte uma mini-lista: cabeçalho (Nome, Valor) na linha 1 e 3 itens embaixo."],
    "m1-3": ["Deixe o cabeçalho em negrito (Ctrl+N) com cor de fundo e bordas em toda a tabela.", "Formate uma coluna como Moeda (R$) e veja o ##### se a coluna ficar estreita — depois alargue com duplo-clique."],
    "m1-4": ["Em duas células digite 150 e 200; numa terceira escreva =A1+B1 e veja o resultado mudar quando você altera um valor.", "Selecione uma coluna de números e use Alt+= (AutoSoma)."],
    "m1-5": ["Salve o arquivo com Ctrl+B em .xlsx e renomeie a aba para algo útil.", "Provoque um #DIV/0! (divida por uma célula vazia) e depois conserte — para perder o medo do erro."],
    "m2-1": ["Numa lista de números, escreva SOMA, MÉDIA, MÁXIMO e MÍNIMO embaixo. Confira com a barra de status.", "Use CONT.VALORES para contar quantos nomes há numa lista (mesmo com texto)."],
    "m2-2": ["Monte preço × quantidade numa coluna arrastando a fórmula; veja as referências 'andarem'.", "Coloque um desconto fixo numa célula e use $ (com F4) para travá-la na fórmula da lista inteira."],
    "m2-3": ["Crie uma coluna 'Situação' com =SE(nota>=7;\"Aprovado\";\"Reprovado\").", "Some uma 2ª condição com E: aprovado só se nota≥7 E presença≥75%."],
    "m2-4": ["Use CONT.SE para contar quantas vendas são de uma região específica.", "Use SOMASE (e depois SOMASES) para somar o valor só de uma região/mês."],
    "m2-5": ["Monte uma tabela de produtos (código/preço) e use PROCV (com FALSO) para buscar o preço por código.", "Provoque um #N/D buscando um código que não existe e entenda por quê."],
    "m2-6": ["Junte nome e sobrenome com & numa coluna nova.", "Use =HOJE() e =A2+30 para calcular um vencimento daqui a 30 dias."],
    "m3-1": ["Selecione seus dados com cabeçalho e aperte Ctrl+T para virar Tabela. Teste os filtros.", "Classifique do maior para o menor por uma coluna de valores."],
    "m3-2": ["Aplique Formatação Condicional: pinte de vermelho tudo abaixo de uma meta.", "Adicione Barras de Dados numa coluna para comparar de relance."],
    "m3-3": ["Crie um gráfico de Colunas comparando categorias e dê um título que diga a conclusão.", "Crie um gráfico de Linhas para uma evolução mês a mês."],
    "m3-4": ["Crie sua primeira Tabela Dinâmica: arraste um campo para Linhas e o valor para Valores.", "Adicione um 2º campo nas Colunas (ex.: meses) e veja o cruzamento."],
    "m3-5": ["Crie uma lista suspensa com Validação de Dados (ex.: Sim/Não).", "Envolva um PROCV com SEERRO para mostrar 'não encontrado' em vez de #N/D."],
  };
  function injetarMissoes() {
    Object.keys(MISSOES_PRATICAS).forEach((mod) => {
      const secao = document.querySelector(`[data-modulo="${mod}"]`);
      if (!secao) return;
      const btn = secao.querySelector(".btn-concluir");
      if (!btn) return;
      const bloco = document.createElement("div");
      bloco.className = "missoes";
      bloco.innerHTML = `<span class="missoes-titulo">🔥 Missões práticas — faça no Excel agora:</span>` +
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
    estado.missoes[cb.dataset.missao] = cb.checked; salvar();
    if (cb.checked) avisar("🔥 Missão cumprida! Excel se aprende digitando.");
  });
  injetarMissoes();

  /* ============================================================ QUIZZES ============================================================ */
  const PERGUNTAS = {
    quiz1: [
      { p: "O cruzamento da coluna C com a linha 5 é a célula…", o: ["5C", "C5", "CL5", "C:5"], c: 1, e: "Primeiro a letra da coluna, depois o número da linha: C5." },
      { p: "As colunas são identificadas por…", o: ["Números", "Letras", "Cores", "Símbolos"], c: 1, e: "Colunas = letras (A, B, C); linhas = números (1, 2, 3)." },
      { p: "O ARQUIVO inteiro do Excel chama-se…", o: ["Planilha", "Pasta de Trabalho", "Aba", "Documento"], c: 1, e: "Pasta de Trabalho = arquivo; Planilha = cada aba dentro dele." },
      { p: "Um número digitado encosta naturalmente na…", o: ["Esquerda", "Direita", "Centro", "Em cima"], c: 1, e: "Número vai para a direita; texto, para a esquerda. Se um 'número' foi pra esquerda, virou texto." },
      { p: "Toda fórmula no Excel começa com…", o: ["O sinal de +", "O sinal de =", "Parênteses", "Aspas"], c: 1, e: "Sem o = na frente, o Excel trata como texto." },
      { p: "Para somar de A1 até A10, o certo é…", o: ["=A1+A10", "=SOMA(A1:A10)", "=SOMAR(A1-A10)", "=A1 ATÉ A10"], c: 1, e: "O dois-pontos (A1:A10) significa 'até'. SOMA é a função." },
      { p: "Você vê ##### numa célula. Isso significa…", o: ["Erro grave", "A coluna está estreita demais para o número", "Vírus", "Fórmula errada"], c: 1, e: "Não é erro: alargue a coluna (duplo-clique na borda do cabeçalho)." },
      { p: "No Excel em português, os argumentos de uma função são separados por…", o: ["Vírgula ,", "Ponto e vírgula ;", "Dois-pontos :", "Barra /"], c: 1, e: "No pt-BR é ponto e vírgula. Ex.: =SOMA(A1;A2;A3)." },
      { p: "A 'alça de preenchimento' serve para…", o: ["Apagar células", "Copiar a fórmula para várias linhas arrastando", "Mudar a cor", "Salvar"], c: 1, e: "É o quadradinho no canto da célula: arraste (ou duplo-clique) para repetir a fórmula." },
      { p: "Qual atalho desfaz a última ação?", o: ["Ctrl + Z", "Ctrl + S", "Ctrl + P", "Ctrl + A"], c: 0, e: "Ctrl+Z desfaz; Ctrl+Y refaz. Seu melhor amigo." },
      { p: "O formato de arquivo moderno do Excel é…", o: [".doc", ".xlsx", ".pdf", ".txt"], c: 1, e: ".xlsx é o padrão atual. .xls é só para versões muito antigas." },
      { p: "A Barra de Fórmulas mostra…", o: ["Só o resultado", "O conteúdo real da célula (a fórmula, se houver)", "As cores", "O nome do arquivo"], c: 1, e: "A célula mostra o resultado; a barra de fórmulas mostra a fórmula por trás." },
      { p: "Por que usar =A1+B1 em vez de =150+200?", o: ["É mais bonito", "Se os valores mudarem, o resultado se atualiza sozinho", "É obrigatório", "Não faz diferença"], c: 1, e: "Referenciar células é o que torna a planilha 'viva' e automática." },
      { p: "Boa prática ao montar uma tabela:", o: ["Misturar nome e telefone na mesma célula", "Uma informação por célula, com cabeçalho na 1ª linha", "Deixar linhas em branco no meio", "Mesclar tudo"], c: 1, e: "Dados organizados são pré-requisito para fórmulas, filtros e tabela dinâmica." },
      { p: "Atalho da AutoSoma:", o: ["Alt + =", "Ctrl + S", "F2", "Shift + S"], c: 0, e: "Selecione os números e aperte Alt+= para somar automaticamente." },
      { p: "Mesclar células dentro de uma tabela de dados…", o: ["É recomendado sempre", "Atrapalha filtros, seleção de colunas e tabela dinâmica", "Acelera o Excel", "Não tem efeito"], c: 1, e: "Mesclar é veneno em tabelas. Use só em títulos/capa." },
      { p: "Congelar Painéis serve para…", o: ["Travar o arquivo com senha", "Manter o cabeçalho visível ao rolar listas grandes", "Congelar a tela", "Apagar dados"], c: 1, e: "Exibir → Congelar Painéis trava as primeiras linhas/colunas." },
      { p: "Uma data como 10/03/2026 é tratada pelo Excel como…", o: ["Texto puro", "Um número (por isso dá para somar dias)", "Uma imagem", "Erro"], c: 1, e: "Datas são números internamente — por isso =A2+30 dá a data 30 dias depois." },
      { p: "Para renomear uma aba 'Plan1', você…", o: ["Não dá para renomear", "Dá duplo-clique no nome dela", "Apaga e cria outra", "Usa uma fórmula"], c: 1, e: "Duplo-clique no nome da aba — e dê uma cor para organizar." },
    ],
    quiz2: [
      { p: "Para contar quantos NOMES (texto) há numa lista, use…", o: ["CONT.NÚM", "CONT.VALORES", "SOMA", "MÉDIA"], c: 1, e: "CONT.NÚM conta só números; CONT.VALORES conta qualquer célula preenchida." },
      { p: "=MÉDIA(B2:B20) faz o quê?", o: ["Soma tudo", "Soma ÷ quantidade (a média)", "O maior valor", "Conta as células"], c: 1, e: "MÉDIA = soma dividida pela quantidade de números." },
      { p: "Você arrasta =A1*B1 para baixo. Na linha de baixo vira…", o: ["=A1*B1 (igual)", "=A2*B2", "=A1*B2", "Erro"], c: 1, e: "Referência relativa 'anda' junto: A1→A2, B1→B2." },
      { p: "Para TRAVAR a célula E1 numa fórmula, escreve-se…", o: ["E1", "$E$1", "E$1$", "(E1)"], c: 1, e: "$E$1 é referência absoluta. A tecla F4 coloca os $ automaticamente." },
      { p: "Qual tecla alterna entre A1 → $A$1 → A$1 → $A1?", o: ["F1", "F2", "F4", "F9"], c: 2, e: "F4 cicla os tipos de referência. Nunca digite o $ na mão." },
      { p: "Quando usar referência absoluta ($)?", o: ["Sempre", "Quando uma célula deve ficar fixa para todas as linhas (ex.: taxa de imposto)", "Nunca", "Só em texto"], c: 1, e: "Valor único e fixo que muitas fórmulas usam = trave com $." },
      { p: "=SE(B2>=7;\"Aprovado\";\"Reprovado\") retorna 'Aprovado' quando…", o: ["B2 for menor que 7", "B2 for maior ou igual a 7", "B2 estiver vazio", "Sempre"], c: 1, e: "Se a condição é verdadeira, vem o 1º resultado; senão, o 2º." },
      { p: "Numa função SE, o texto resultado deve estar…", o: ["Sem nada", "Entre aspas (\"Aprovado\")", "Entre parênteses", "Em maiúsculas"], c: 1, e: "Textos vão entre aspas; números, não." },
      { p: "Para exigir DUAS condições verdadeiras ao mesmo tempo, use…", o: ["OU", "E", "SOMA", "PROCV"], c: 1, e: "E = todas precisam ser verdadeiras. OU = basta uma." },
      { p: "=SOMASE(C2:C100;\"Sul\";D2:D100) faz o quê?", o: ["Soma tudo de C", "Soma D apenas nas linhas em que C = 'Sul'", "Conta os 'Sul'", "Multiplica C por D"], c: 1, e: "SOMASE: (onde testar ; o quê ; o que somar)." },
      { p: "No SOMASES, o intervalo a somar vem…", o: ["Por último", "PRIMEIRO (depois vêm os pares teste/critério)", "No meio", "Tanto faz"], c: 1, e: "Pegadinha: no SOMASE a soma é o 3º; no SOMASES, o 1º." },
      { p: "A função estrela para BUSCAR o preço de um produto pelo código é…", o: ["SOMA", "PROCV", "MÉDIA", "SE"], c: 1, e: "PROCV procura um valor e traz a informação correspondente da tabela." },
      { p: "O último argumento do PROCV deve quase sempre ser…", o: ["VERDADEIRO", "FALSO (correspondência exata)", "0,5", "Vazio"], c: 1, e: "FALSO garante exatidão. Esquecer disso traz resultados errados sem avisar." },
      { p: "O PROCV só consegue procurar…", o: ["Em qualquer coluna e direção", "Na 1ª coluna da tabela, olhando para a direita", "De baixo para cima", "Em outra planilha apenas"], c: 1, e: "Limitação clássica do PROCV. O PROCX (moderno) resolve isso." },
      { p: "O erro #N/D no PROCV significa…", o: ["Coluna estreita", "Não encontrou o valor procurado", "Dividiu por zero", "Texto onde esperava número"], c: 1, e: "#N/D = 'não disponível'. Cheque espaços sobrando e código texto×número." },
      { p: "Qual função MODERNA substitui o PROCV com mais flexibilidade?", o: ["PROCH", "PROCX", "PROCW", "BUSCAR2"], c: 1, e: "PROCX busca em qualquer direção e dispensa contar colunas (Microsoft 365)." },
      { p: "Para juntar o conteúdo de A2 e B2 numa célula, use…", o: ["=A2+B2", "=A2&B2", "=JUNTAR(A2;B2)", "=A2/B2"], c: 1, e: "O & 'cola' textos. =A2&\" \"&B2 junta com um espaço no meio." },
      { p: "=ARRUMAR(A2) é útil porque…", o: ["Soma valores", "Remove espaços sobrando (que quebram o PROCV)", "Muda a cor", "Cria gráfico"], c: 1, e: "Espaços invisíveis são a causa nº1 de PROCV que 'não acha'. ARRUMAR resolve." },
      { p: "=HOJE() retorna…", o: ["Um texto fixo", "A data de hoje, sempre atualizada", "A hora apenas", "Erro"], c: 1, e: "Atualiza sozinha. Para data fixa, use o atalho Ctrl+;." },
    ],
    quiz3: [
      { p: "O atalho que transforma seus dados numa Tabela é…", o: ["Ctrl + T", "Ctrl + G", "Ctrl + B", "Ctrl + D"], c: 0, e: "Ctrl+T cria a Tabela com filtros, linhas zebradas e expansão automática." },
      { p: "Transformar em Tabela (Ctrl+T) dá de brinde…", o: ["Senha", "Filtros automáticos e classificação por coluna", "Macros", "Gráficos 3D"], c: 1, e: "Cada cabeçalho ganha uma setinha de filtro/classificação." },
      { p: "A célula que muda de cor sozinha conforme o valor é feita com…", o: ["Formatação Condicional", "PROCV", "Validação de Dados", "Mesclar"], c: 0, e: "Página Inicial → Formatação Condicional. Dá vida a painéis." },
      { p: "Para mostrar a EVOLUÇÃO de vendas mês a mês, o gráfico ideal é…", o: ["Pizza", "Linhas", "Rosca", "Dispersão"], c: 1, e: "Linhas = tempo/evolução. Colunas = comparar categorias." },
      { p: "Gráfico de PIZZA funciona bem quando…", o: ["Há muitas fatias parecidas", "Há poucas fatias (até ~5) e você quer mostrar participação no total", "Você compara ao longo do tempo", "Sempre"], c: 1, e: "Pizza só com poucas fatias. Para comparar, coluna vence." },
      { p: "A Tabela Dinâmica serve para…", o: ["Proteger a planilha", "Resumir milhares de linhas sem fórmula, arrastando campos", "Criar senhas", "Imprimir"], c: 1, e: "Arraste campos para Linhas/Valores e o resumo aparece em segundos." },
      { p: "Numa Tabela Dinâmica, o campo que você quer SOMAR vai na área…", o: ["Linhas", "Valores", "Filtros", "Colunas"], c: 1, e: "Valores = o que somar/contar. Linhas = como agrupar." },
      { p: "Pré-requisito para uma boa Tabela Dinâmica é…", o: ["Ter macros", "Dados organizados (cabeçalho, 1 info por coluna, sem mesclar)", "Usar PROCV antes", "Ter Excel 2007"], c: 1, e: "Lixo entra, lixo sai. Por isso a organização do Nível 1 importa tanto." },
      { p: "Depois de mudar os dados de origem, a Tabela Dinâmica…", o: ["Atualiza sozinha sempre", "Precisa de botão direito → Atualizar", "Tem que ser refeita do zero", "Não muda nunca"], c: 1, e: "Clique com o direito → Atualizar (ou Ctrl+Alt+F5)." },
      { p: "A Validação de Dados é usada para…", o: ["Somar valores", "Criar listas suspensas e limitar o que pode ser digitado", "Fazer gráficos", "Travar o arquivo"], c: 1, e: "Dados → Validação: fim da digitação bagunçada (Sim/Não, regiões válidas)." },
      { p: "=SEERRO(PROCV(...);\"não encontrado\") faz o quê?", o: ["Acelera o PROCV", "Mostra um texto amigável em vez de #N/D quando dá erro", "Apaga a fórmula", "Soma os erros"], c: 1, e: "SEERRO troca o erro feio por uma mensagem sua." },
      { p: "Para colar SÓ os valores (sem a fórmula), use…", o: ["Ctrl + V", "Ctrl + Shift + V (Colar Especial → Valores)", "Ctrl + C", "Ctrl + Z"], c: 1, e: "Colar Especial só valores 'congela' o resultado, sem trazer a fórmula." },
      { p: "Para selecionar rapidamente até o fim de uma coluna de dados…", o: ["Ctrl + Shift + Seta", "Alt + F4", "Ctrl + P", "Shift + Espaço"], c: 0, e: "Ctrl+Shift+Seta seleciona do cursor até o fim do bloco de dados." },
      { p: "Um bom título de gráfico é…", o: ["\"Gráfico 1\"", "Uma frase que diz a conclusão (ex.: 'Vendas sobem 30% no trimestre')", "O nome do arquivo", "Vazio fica melhor"], c: 1, e: "O título deve comunicar a mensagem, não só rotular." },
      { p: "Para destacar VALORES REPETIDOS numa lista, o mais rápido é…", o: ["PROCV", "Formatação Condicional → Realçar → Valores Duplicados", "SOMASE", "Mesclar"], c: 1, e: "Em 2 cliques a formatação condicional pinta os duplicados." },
      { p: "Proteger Planilha (Revisão) serve para…", o: ["Esconder o Excel", "Impedir que apaguem as células de fórmula sem querer", "Aumentar a velocidade", "Criar abas"], c: 1, e: "Trava as células travadas; bom para planilhas que outros vão usar." },
      { p: "Barras de Dados (formatação condicional) servem para…", o: ["Somar colunas", "Mostrar a proporção do valor dentro da própria célula", "Criar filtros", "Inserir imagens"], c: 1, e: "Uma mini-barra na célula ajuda a comparar quantidades de relance." },
      { p: "A 'Linha de Totais' de uma Tabela permite…", o: ["Escolher Soma/Média por coluna num clique", "Apagar a tabela", "Criar macros", "Mudar o idioma"], c: 0, e: "Na aba Design da Tabela, ative a Linha de Totais e escolha a operação." },
      { p: "Trabalhar com Tabela (Ctrl+T) em vez de células soltas é…", o: ["Perda de tempo", "O hábito profissional nº1 — filtros, expansão e fórmulas que se atualizam", "Só para avançados", "Igual"], c: 1, e: "Tabela mantém tudo organizado e dinâmico. Faça sempre." },
    ],
  };
  const QUIZ_TAM = 10;
  function embaralhar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function montarQuiz(caixa) {
    const id = caixa.dataset.quiz;
    const perguntas = PERGUNTAS[id];
    const totalSorteado = Math.min(QUIZ_TAM, perguntas.length);
    let ordem = [], atual = 0, pontos = 0;
    function telaInicio() {
      const info = estado.quizes[id];
      caixa.innerHTML = `<div class="quiz-inicio">
        <p><strong>${totalSorteado} perguntas</strong> sorteadas de um banco de ${perguntas.length} — refazer traz perguntas novas! Acerte <strong>70%+</strong> para concluir. 😉</p>
        <button class="btn btn-primario" data-acao="comecar">Começar o quiz</button>
        ${info ? `<p class="quiz-recorde">Sua melhor nota: <strong>${info.melhor}%</strong>${info.passou ? " · ✅ etapa concluída" : ""}</p>` : ""}</div>`;
    }
    function telaPergunta() {
      const q = ordem[atual];
      const idx = embaralhar(q.o.map((_, i) => i));
      caixa.innerHTML = `<div class="quiz-jogo">
        <div class="quiz-topo"><span>Pergunta ${atual + 1}/${ordem.length}</span><span>${pontos} acerto${pontos === 1 ? "" : "s"}</span></div>
        <div class="barra barra-quiz"><div class="barra-fill" style="width:${(atual / ordem.length) * 100}%"></div></div>
        <h3 class="quiz-pergunta">${q.p}</h3>
        <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-opcao="${i}">${q.o[i]}</button>`).join("")}</div>
        <p class="quiz-feedback oculto"></p>
        <button class="btn btn-primario oculto" data-acao="proxima">Próxima →</button></div>`;
    }
    function responder(i) {
      const q = ordem[atual];
      if (i === q.c) pontos++;
      caixa.querySelectorAll(".quiz-opcao").forEach((b) => {
        b.disabled = true; const k = Number(b.dataset.opcao);
        if (k === q.c) b.classList.add("correta"); else if (k === i) b.classList.add("errada");
      });
      const fbk = caixa.querySelector(".quiz-feedback");
      fbk.textContent = (i === q.c ? "✅ Acertou! " : "❌ Quase! ") + q.e;
      fbk.classList.remove("oculto");
      const btn = caixa.querySelector('[data-acao="proxima"]');
      btn.textContent = atual + 1 < ordem.length ? "Próxima →" : "Ver resultado 🏁";
      btn.classList.remove("oculto");
    }
    function telaFim() {
      const pct = Math.round((pontos / ordem.length) * 100);
      const passou = pct >= 70;
      const info = estado.quizes[id] || { melhor: 0, passou: false };
      info.melhor = Math.max(info.melhor, pct); info.passou = info.passou || passou;
      estado.quizes[id] = info; salvar(); atualizarTudo();
      if (passou) festejar();
      caixa.innerHTML = `<div class="quiz-fim">
        <h3>${pct === 100 ? "🏆 Perfeito!" : passou ? "🎉 Mandou bem!" : "💪 Quase lá!"}</h3>
        <p class="quiz-nota">${pct}%</p>
        <p>${pontos} de ${ordem.length} certas. ${passou ? "Etapa concluída — siga em frente." : "Precisa de 70%. Releia as etapas e volte!"}</p>
        ${passou ? '<p class="quiz-selo">✅ Quiz aprovado</p>' : ""}
        <button class="btn btn-primario" data-acao="comecar" style="margin-top:.8rem">Tentar de novo</button></div>`;
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

  /* ============================================================ JOGO 1 — Qual recurso usar ============================================================ */
  const MISSOES = [
    { t: "Você tem uma coluna com 500 valores de venda e precisa do TOTAL e da MÉDIA.", r: "calculo", e: "SOMA e MÉDIA — cálculo direto. (Ou só olhar a barra de status!)" },
    { t: "Numa lista de notas, marcar 'Aprovado' ou 'Reprovado' conforme a nota.", r: "logica", e: "Função SE — decisão condicional." },
    { t: "Trazer o PREÇO de cada produto a partir do código, de uma tabela de referência.", r: "busca", e: "PROCV/PROCX — buscar dado correspondente." },
    { t: "Resumir 10.000 linhas de vendas como 'total por vendedor por mês'.", r: "analise", e: "Tabela Dinâmica — resumo sem fórmula." },
    { t: "Somar o faturamento apenas da região 'Sul'.", r: "logica", e: "SOMASE — soma com condição." },
    { t: "Pintar de vermelho, automaticamente, tudo que ficou abaixo da meta.", r: "analise", e: "Formatação Condicional." },
    { t: "Contar quantos clientes existem numa lista de nomes.", r: "calculo", e: "CONT.VALORES — conta células preenchidas (texto)." },
    { t: "Mostrar a evolução do faturamento mês a mês para a diretoria.", r: "analise", e: "Gráfico de Linhas." },
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
      if (estado.jogo.recorde > 0) el.textContent = `Seu recorde: ${estado.jogo.recorde} pts` + (estado.jogo.passou ? " · ✅ concluído" : "");
    }
    mostrarRecorde();
    function iniciar() {
      ordem = embaralhar(MISSOES); rodada = 0; pontos = 0; seq = 0;
      jogoInicio.classList.add("oculto"); jogoFim.classList.add("oculto"); jogoRodada.classList.remove("oculto"); proxima();
    }
    function proxima() {
      const m = ordem[rodada];
      elContador.textContent = `Situação ${rodada + 1}/${ordem.length}`;
      elPontos.textContent = `${pontos} pts`;
      elStreak.textContent = seq >= 2 ? `🔥 x${seq}` : "";
      elMissao.textContent = m.t; elFeedback.classList.add("oculto");
      escolhas.forEach((b) => { b.disabled = false; b.classList.remove("correta", "errada"); });
      TEMPO_MISSAO = tempoMissaoAtual(); restante = TEMPO_MISSAO; elTimer.style.width = "100%";
      clearInterval(cron);
      const telaJogo = document.querySelector('[data-tela="jogo"]');
      cron = setInterval(() => {
        if (document.hidden || telaJogo.classList.contains("oculto")) return;
        restante -= 0.1; elTimer.style.width = Math.max(0, (restante / TEMPO_MISSAO) * 100) + "%";
        if (restante <= 0) { clearInterval(cron); responderJogo(null); }
      }, 100);
    }
    function responderJogo(cat) {
      clearInterval(cron);
      const m = ordem[rodada];
      const certo = cat === m.r;
      let ganho = 0, bonus = 0;
      if (certo) { seq++; ganho = Math.max(20, Math.round((restante / TEMPO_MISSAO) * 100)); bonus = Math.min(30, (seq - 1) * 10); pontos += ganho + bonus; }
      else seq = 0;
      elPontos.textContent = `${pontos} pts`; elStreak.textContent = seq >= 2 ? `🔥 x${seq}` : "";
      escolhas.forEach((b) => { b.disabled = true; if (b.dataset.modelo === m.r) b.classList.add("correta"); else if (b.dataset.modelo === cat) b.classList.add("errada"); });
      elFeedback.textContent = cat === null ? `⏰ Tempo! ${m.e}` : (certo ? `✅ Boa! +${ganho}${bonus ? ` (+${bonus} 🔥)` : ""} pts. ` : "❌ Não foi. ") + m.e;
      elFeedback.classList.remove("oculto");
      setTimeout(() => { rodada++; if (rodada < ordem.length) proxima(); else fim(); }, 2600);
    }
    function fim() {
      jogoRodada.classList.add("oculto"); jogoFim.classList.remove("oculto");
      const pct = Math.min(100, Math.round((pontos / PONTUACAO_MAXIMA) * 100));
      const passou = pct >= 50;
      estado.jogo.recorde = Math.max(estado.jogo.recorde, pontos); estado.jogo.passou = estado.jogo.passou || passou;
      salvar(); atualizarTudo(); if (passou) festejar();
      document.getElementById("jogoResultadoTitulo").textContent = pct >= 85 ? "🏆 Mestre das ferramentas!" : passou ? "🎉 Escolhas certeiras!" : "💪 Revise os recursos e volte!";
      document.getElementById("jogoNota").textContent = `${pontos} pts`;
      document.getElementById("jogoResultadoMsg").textContent = `Você fez ${pct}% da pontuação base. ` + (passou ? "Desafio concluído para o certificado! ✅" : "Alcance 50% para contar no certificado.");
      mostrarRecorde();
    }
    document.getElementById("jogoComecar").addEventListener("click", iniciar);
    document.getElementById("jogoReiniciar").addEventListener("click", iniciar);
    escolhas.forEach((b) => b.addEventListener("click", () => { if (!b.disabled) responderJogo(b.dataset.modelo); }));
  }

  /* ============================================================ JOGO 2 — Conserta a Fórmula ============================================================ */
  const OFICINA = [
    { c: "Somar de A1 até A10.", f: "=A1+A10", o: ["=SOMA(A1:A10)", "=SOMA(A1;A10)", "=SOMAR(A1:A10)"], r: 0, e: "=A1+A10 soma só os extremos; =SOMA(A1;A10) também (só os dois). O dois-pontos (A1:A10) é 'até'." },
    { c: "Travar a taxa de E1 ao arrastar a fórmula para a lista.", f: "=B2*E1", o: ["=B2*$E$1", "=$B$2*E1", "=B2*E1$"], r: 0, e: "A taxa fixa precisa de $ (E1 → $E$1, com F4). B2 deve continuar relativo para 'andar' nas linhas." },
    { c: "Buscar o preço pelo código com correspondência exata.", f: "=PROCV(A2;F2:H100;3)", o: ["=PROCV(A2;F2:H100;3;FALSO)", "=PROCV(A2;F2:H100;FALSO)", "=PROCV(3;A2;F2:H100)"], r: 0, e: "Faltou o FALSO no fim (exata). Sem ele, o Excel pode trazer um valor errado sem avisar." },
    { c: "Texto numa função SE.", f: "=SE(B2>=7;Aprovado;Reprovado)", o: ["=SE(B2>=7;\"Aprovado\";\"Reprovado\")", "=SE(B2>=7;'Aprovado';'Reprovado')", "=SE(B2>=7=Aprovado)"], r: 0, e: "Texto vai entre ASPAS DUPLAS. Sem aspas, o Excel acha que é um nome e dá #NOME?." },
    { c: "Somar o valor (col. D) só da região 'Sul' (col. C).", f: "=SOMASE(D2:D100;\"Sul\";C2:C100)", o: ["=SOMASE(C2:C100;\"Sul\";D2:D100)", "=SOMASES(D2:D100;\"Sul\")", "=SOMA(C2:C100;\"Sul\")"], r: 0, e: "No SOMASE a ordem é (onde TESTAR ; o quê ; o que SOMAR). A versão errada testou na coluna trocada." },
    { c: "Juntar nome (A2) e sobrenome (B2) com espaço.", f: "=A2+B2", o: ["=A2&\" \"&B2", "=SOMA(A2;B2)", "=A2 B2"], r: 0, e: "Texto não soma com +. Use & para colar; \" \" adiciona o espaço entre as palavras." },
    { c: "Evitar #N/D quando o PROCV não acha.", f: "=PROCV(A2;F:H;3;FALSO)", o: ["=SEERRO(PROCV(A2;F:H;3;FALSO);\"não encontrado\")", "=SENÃO(PROCV(A2;F:H;3))", "=PROCV(A2;F:H;3;FALSO;0)"], r: 0, e: "Envolva com SEERRO para mostrar um texto amigável em vez do erro feio." },
    { c: "Contar quantos clientes (nomes) há na coluna A.", f: "=CONT.NÚM(A2:A100)", o: ["=CONT.VALORES(A2:A100)", "=SOMA(A2:A100)", "=CONT.NÚM(A:A)"], r: 0, e: "CONT.NÚM ignora texto e contaria zero nomes! Para contar texto preenchido, use CONT.VALORES." },
  ];
  const oficinaCaixa = document.getElementById("oficinaCaixa");
  if (oficinaCaixa) {
    let ofOrdem = [], ofAtual = 0, ofPontos = 0;
    function ofInicio() {
      const info = estado.oficina;
      oficinaCaixa.innerHTML = `<div class="quiz-inicio">
        <p><strong>${OFICINA.length} rodadas</strong>: uma fórmula com problema e 3 opções — escolha a CORRETA. Acerte <strong>6+</strong> para o selo de Fera das Fórmulas. 🧪</p>
        <button class="btn btn-primario" data-of="comecar">Começar a oficina</button>
        ${info.melhor ? `<p class="quiz-recorde">Recorde: <strong>${info.melhor}/${OFICINA.length}</strong>${info.passou ? " · ✅ selo conquistado" : ""}</p>` : ""}</div>`;
    }
    function ofRodada() {
      const q = ofOrdem[ofAtual];
      const idx = embaralhar(q.o.map((_, i) => i));
      oficinaCaixa.innerHTML = `<div class="quiz-jogo">
        <div class="quiz-topo"><span>Rodada ${ofAtual + 1}/${ofOrdem.length}</span><span>${ofPontos} acerto${ofPontos === 1 ? "" : "s"}</span></div>
        <div class="barra barra-quiz"><div class="barra-fill" style="width:${(ofAtual / ofOrdem.length) * 100}%"></div></div>
        <p class="oficina-cenario">📌 ${q.c}</p>
        <p class="oficina-fraco">Fórmula com problema: <em>${q.f}</em></p>
        <h3 class="quiz-pergunta" style="font-size:1rem">Qual é a correta?</h3>
        <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-of-op="${i}">${q.o[i]}</button>`).join("")}</div>
        <p class="quiz-feedback oculto"></p>
        <button class="btn btn-primario oculto" data-of="proxima">Próxima →</button></div>`;
    }
    function ofResponder(i) {
      const q = ofOrdem[ofAtual];
      if (i === q.r) ofPontos++;
      oficinaCaixa.querySelectorAll("[data-of-op]").forEach((b) => {
        b.disabled = true; const k = Number(b.dataset.ofOp);
        if (k === q.r) b.classList.add("correta"); else if (k === i) b.classList.add("errada");
      });
      const fbk = oficinaCaixa.querySelector(".quiz-feedback");
      fbk.textContent = (i === q.r ? "✅ Boa! " : "❌ Quase. ") + q.e; fbk.classList.remove("oculto");
      const btn = oficinaCaixa.querySelector('[data-of="proxima"]');
      btn.textContent = ofAtual + 1 < ofOrdem.length ? "Próxima →" : "Ver resultado 🏁"; btn.classList.remove("oculto");
    }
    function ofFim() {
      const passou = ofPontos >= 6;
      estado.oficina.melhor = Math.max(estado.oficina.melhor, ofPontos); estado.oficina.passou = estado.oficina.passou || passou;
      salvar(); if (passou) festejar();
      oficinaCaixa.innerHTML = `<div class="quiz-fim">
        <h3>${ofPontos === OFICINA.length ? "🏆 Fórmulas impecáveis!" : passou ? "🧪 Fera das Fórmulas!" : "💪 Releia o Nível 2 e volte!"}</h3>
        <p class="quiz-nota">${ofPontos}/${OFICINA.length}</p>
        <p>${passou ? "Você enxerga o erro na hora. Isso é nível de mercado." : "Acerte 6 para o selo."}</p>
        ${passou ? '<p class="quiz-selo">🧪 Fera das Fórmulas</p>' : ""}
        <button class="btn btn-primario" data-of="comecar" style="margin-top:.8rem">Jogar de novo</button></div>`;
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

  /* ============================================================ DESAFIO MESTRE ============================================================ */
  const DESAFIO = [
    { p: "A1=10, A2=20, A3=30. Quanto retorna =SOMA(A1;A3)?", o: ["60", "40", "30", "10"], c: 1, e: "Ponto e vírgula = SÓ A1 e A3 (10+30=40). Para 'de A1 até A3' (=60) seria A1:A3 com dois-pontos." },
    { p: "Quanto retorna =2+3*4 ?", o: ["20", "14", "24", "9"], c: 1, e: "Multiplicação antes da soma: 3*4=12, +2 = 14. Use parênteses se quiser (2+3)*4=20." },
    { p: "Você copia =A1*$B$1 da célula C1 para C2. A fórmula em C2 fica…", o: ["=A1*$B$1", "=A2*$B$1", "=A2*$B$2", "=A1*$B$2"], c: 1, e: "A1 é relativo (vira A2); $B$1 é absoluto (não muda)." },
    { p: "=MÉDIA(2;4;9) retorna…", o: ["5", "15", "4", "4,5"], c: 0, e: "(2+4+9)/3 = 15/3 = 5." },
    { p: "B2 contém o texto '7' (alinhado à esquerda). =B2+1 retorna…", o: ["8", "#VALOR!", "71", "0"], c: 0, e: "Pegadinha: o Excel CONVERTE texto numérico em operações matemáticas → 8. Mas '7' não seria contado por CONT.NÚM nem somado por SOMA." },
    { p: "Você arrasta =A1+B1 de C1 para C3. A fórmula em C3 fica…", o: ["=A3+B3", "=A1+B1", "#REF!", "=A1+B3"], c: 0, e: "Referência relativa acompanha: em C3 vira =A3+B3." },
    { p: "=PROCV(A2;F2:H50;4;FALSO) com a tabela indo só até a coluna H retorna…", o: ["A 4ª coluna", "#REF!", "#N/D", "0"], c: 1, e: "A tabela F:H tem 3 colunas; pedir a 4ª gera #REF! (referência inexistente)." },
    { p: "Resultado de =SE(10>15;\"A\";SE(10>5;\"B\";\"C\"))", o: ["A", "B", "C", "#NOME?"], c: 1, e: "10>15 é falso → vai pro 2º SE: 10>5 é verdadeiro → 'B'." },
    { p: "=CONT.VALORES de um intervalo com 3 números, 2 textos e 1 célula vazia retorna…", o: ["6", "5", "3", "2"], c: 1, e: "CONT.VALORES conta tudo que está PREENCHIDO: 3+2 = 5 (ignora a vazia)." },
    { p: "=ESQUERDA(\"Império\";3) retorna…", o: ["Imp", "rio", "Impé", "Im"], c: 0, e: "Os 3 primeiros caracteres a partir da esquerda: 'Imp'." },
    { p: "A célula mostra #DIV/0!. A causa é…", o: ["Coluna estreita", "Dividiu por zero ou por célula vazia", "Função com nome errado", "Apagou uma célula referenciada"], c: 1, e: "#DIV/0! = divisão por zero. (Estreita = #####; nome errado = #NOME?; apagou = #REF!.)" },
    { p: "No SOMASES, a estrutura correta é…", o: ["(soma; teste1; crit1; teste2; crit2)", "(teste1; crit1; soma)", "(crit1; teste1; soma)", "(soma; crit1; crit2)"], c: 0, e: "No SOMASES o intervalo de SOMA vem primeiro, depois os pares teste/critério. (No SOMASE a soma é a última.)" },
    { p: "Datas: A1=10/03/2026, A2=15/03/2026. =A2-A1 retorna…", o: ["5", "Uma data", "#VALOR!", "25"], c: 0, e: "Subtração de datas dá a quantidade de DIAS: 5." },
    { p: "PROCV traz #N/D mesmo com o código existindo na tabela. Causa MAIS provável:", o: ["Excel desatualizado", "Espaço sobrando ou código como texto num lado e número no outro", "Falta de gráfico", "Coluna mesclada"], c: 1, e: "Diferença texto×número e espaços invisíveis. =ARRUMAR() e padronizar o tipo resolvem." },
    { p: "Para travar só a LINHA do topo, deixando a coluna 'andar', a referência mista é…", o: ["$A$1", "A$1", "$A1", "A1"], c: 1, e: "A$1 trava só a LINHA (o número). $A1 travaria só a coluna." },
    { p: "Pizza com 8 fatias de valores parecidos é ruim porque…", o: ["É lento", "O olho não distingue fatias quase iguais — coluna comunica melhor", "Não imprime", "Excel não permite"], c: 1, e: "Pizza só com poucas fatias e diferenças claras. Para comparar, gráfico de colunas." },
  ];
  const desafioCaixa = document.getElementById("desafioCaixa");
  if (desafioCaixa) {
    const N = Math.min(12, DESAFIO.length);
    let dOrdem = [], dAtual = 0, dPontos = 0;
    function dInicio() {
      const info = estado.desafio;
      desafioCaixa.innerHTML = `<div class="quiz-inicio">
        <p><strong>${N} perguntas difíceis</strong> de um banco de ${DESAFIO.length}: resultados de fórmulas, referências e diagnóstico de erros. Acerte <strong>80%+</strong> (${Math.ceil(N * 0.8)}/${N}) para o título de Mestre. 🎓</p>
        <button class="btn btn-primario" data-d="comecar">Aceitar o desafio</button>
        ${info.melhor ? `<p class="quiz-recorde">Recorde: <strong>${info.melhor}%</strong>${info.passou ? " · 🎓 Mestre do Excel" : ""}</p>` : ""}</div>`;
    }
    function dRodada() {
      const q = dOrdem[dAtual];
      const idx = embaralhar(q.o.map((_, i) => i));
      desafioCaixa.innerHTML = `<div class="quiz-jogo">
        <div class="quiz-topo"><span>Pergunta ${dAtual + 1}/${dOrdem.length}</span><span>${dPontos} acerto${dPontos === 1 ? "" : "s"}</span></div>
        <div class="barra barra-quiz"><div class="barra-fill" style="width:${(dAtual / dOrdem.length) * 100}%"></div></div>
        <h3 class="quiz-pergunta">${q.p}</h3>
        <div class="quiz-opcoes">${idx.map((i) => `<button class="quiz-opcao" data-d-op="${i}">${q.o[i]}</button>`).join("")}</div>
        <p class="quiz-feedback oculto"></p>
        <button class="btn btn-primario oculto" data-d="proxima">Próxima →</button></div>`;
    }
    function dResponder(i) {
      const q = dOrdem[dAtual];
      if (i === q.c) dPontos++;
      desafioCaixa.querySelectorAll("[data-d-op]").forEach((b) => {
        b.disabled = true; const k = Number(b.dataset.dOp);
        if (k === q.c) b.classList.add("correta"); else if (k === i) b.classList.add("errada");
      });
      const fbk = desafioCaixa.querySelector(".quiz-feedback");
      fbk.textContent = (i === q.c ? "✅ Acertou! " : "❌ Errou. ") + q.e; fbk.classList.remove("oculto");
      const btn = desafioCaixa.querySelector('[data-d="proxima"]');
      btn.textContent = dAtual + 1 < dOrdem.length ? "Próxima →" : "Ver resultado 🏁"; btn.classList.remove("oculto");
    }
    function dFim() {
      const pct = Math.round((dPontos / dOrdem.length) * 100);
      const passou = pct >= 80;
      estado.desafio.melhor = Math.max(estado.desafio.melhor, pct); estado.desafio.passou = estado.desafio.passou || passou;
      salvar(); if (passou) festejar();
      desafioCaixa.innerHTML = `<div class="quiz-fim">
        <h3>${pct === 100 ? "🏆 Você é uma planilha ambulante!" : passou ? "🎓 Mestre do Excel!" : "💪 Esse derruba analista experiente."}</h3>
        <p class="quiz-nota">${dPontos}/${dOrdem.length}</p>
        <p>${passou ? "Título conquistado — você domina as armadilhas do Excel." : "As explicações de cada erro valem o curso. Tente de novo!"}</p>
        ${passou ? '<p class="quiz-selo">🎓 Mestre do Excel</p>' : ""}
        <button class="btn btn-primario" data-d="comecar" style="margin-top:.8rem">Tentar de novo</button></div>`;
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

  /* ============================================================ GUIA DE FUNÇÕES (KIT) ============================================================ */
  const KIT = [
    ["Cálculo", "Soma, média e contagem", "=SOMA(B2:B100)   soma os valores\n=MÉDIA(B2:B100)  média\n=MÁXIMO(B2:B100)  maior\n=MÍNIMO(B2:B100)  menor\n=CONT.VALORES(A2:A100)  conta itens preenchidos (texto)\n=CONT.NÚM(B2:B100)  conta só números"],
    ["Cálculo", "Porcentagem e variação", "Margem: =(Venda-Custo)/Venda\nVariação %: =(Atual-Anterior)/Anterior\n% do total: =B2/$B$100   (trave o total com F4)\nAumentar 10%: =B2*1,1"],
    ["Lógica", "SE simples e encadeado", "=SE(B2>=7;\"Aprovado\";\"Reprovado\")\n=SE(C2>1000;C2*0,05;0)   comissão 5% acima de 1000\n=SES(B2>=9;\"A\";B2>=7;\"B\";B2>=5;\"C\";VERDADEIRO;\"D\")"],
    ["Lógica", "Somar/contar com condição", "=CONT.SE(C2:C100;\"SP\")   conta os 'SP'\n=SOMASE(C2:C100;\"Sul\";D2:D100)   soma D onde C='Sul'\n=SOMASES(D2:D100;C2:C100;\"Sul\";B2:B100;\"Março\")\n=CONT.SES(C2:C100;\"SP\";D2:D100;\">1000\")"],
    ["Busca", "PROCV e PROCX", "=PROCV(A2;F2:H100;3;FALSO)   traz a 3ª coluna (termine sempre com FALSO)\n=PROCX(A2;F2:F100;H2:H100)   moderno, busca em qualquer direção\n=SEERRO(PROCV(A2;F:H;3;FALSO);\"não encontrado\")"],
    ["Texto", "Juntar e limpar texto", "=A2&\" \"&B2   junta com espaço\n=ARRUMAR(A2)   remove espaços sobrando\n=MAIÚSCULA(A2) / =MINÚSCULA(A2) / =PRI.MAIÚSCULA(A2)\n=ESQUERDA(A2;3)   =DIREITA(A2;4)   =EXT.TEXTO(A2;4;2)"],
    ["Datas", "Trabalhar com datas", "=HOJE()   data de hoje\n=A2+30   vencimento daqui a 30 dias\n=B2-A2   dias entre duas datas\n=ANO(A2)  =MÊS(A2)  =DIA(A2)\n=DATADIF(A2;HOJE();\"Y\")   anos completos (idade)"],
    ["Referências", "O cifrão $ (com F4)", "Relativa: A1   (anda ao arrastar)\nAbsoluta: $A$1   (trava tudo — taxa, dólar, total)\nMista: A$1 trava a linha | $A1 trava a coluna\nDica: clique na referência e aperte F4 para alternar."],
    ["Erros", "Decifrar erros", "#####  → coluna estreita (alargue)\n#DIV/0!  → dividiu por zero/vazio\n#VALOR!  → texto onde esperava número\n#NOME?  → nome de função digitado errado\n#N/D  → PROCV não encontrou\n#REF!  → apagou célula usada na fórmula"],
    ["Atalhos", "Atalhos essenciais", "Ctrl+B salvar · Ctrl+Z desfazer\nAlt+= AutoSoma · Ctrl+; data de hoje\nCtrl+T Tabela · Ctrl+Shift+L filtros\nCtrl+Setas pular ao fim · Ctrl+Shift+Setas selecionar\nF4 alterna $ / repete última ação"],
    ["Análise", "Checklist da Tabela Dinâmica", "1) Dados organizados (cabeçalho, 1 info/coluna, sem mesclar)\n2) Clique nos dados → Inserir → Tabela Dinâmica\n3) Arraste: agrupar em LINHAS, somar em VALORES\n4) Cruze com COLUNAS e refine com FILTROS\n5) Mudou os dados? Botão direito → Atualizar"],
    ["Análise", "Formatação condicional útil", "Realçar abaixo da meta: regra 'menor que' → vermelho\nLinha inteira: regra por fórmula =$E2<META\nBarras de Dados: comparar quantidades na própria célula\nDuplicados: Realçar Regras → Valores Duplicados"],
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
          <p class="prompt-card-texto" style="white-space:pre-wrap">${texto}</p>
          <button class="btn-copiar" data-copiar="${texto.replace(/"/g, "&quot;")}">📋 copiar</button>
        </div>`).join("");
    }
    kitFiltros.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-cat]");
      if (!b) return;
      kitFiltros.querySelectorAll(".area-btn").forEach((x) => x.classList.remove("ativo"));
      b.classList.add("ativo"); render(b.dataset.cat);
    });
    render("Todos");
  }

  /* ============================================================ TUTOR ============================================================ */
  const KB = [
    { k: ["celula", "linha", "coluna", "endereco"], t: "Célula, linha e coluna", a: "Coluna = letras (A, B, C). Linha = números (1, 2, 3). A célula é o encontro: a coluna B com a linha 3 é a célula B3. A Caixa de Nome (canto superior esquerdo) mostra qual célula está selecionada." },
    { k: ["pasta de trabalho", "planilha", "aba", "arquivo"], t: "Pasta x Planilha", a: "A Pasta de Trabalho é o ARQUIVO inteiro; a Planilha é cada ABA dentro dele (Plan1, Plan2...). Um arquivo pode ter várias planilhas." },
    { k: ["formula", "comeca com igual", "operadores"], t: "Fórmulas", a: "Toda fórmula começa com =. Operadores: + soma, - subtrai, * multiplica, / divide. Use endereços (=A1+B1) em vez de números fixos. No pt-BR os argumentos são separados por ponto e vírgula." },
    { k: ["soma", "media", "maximo", "minimo", "contar", "cont.valores", "cont.num"], t: "Funções básicas", a: "=SOMA(B2:B20) soma; =MÉDIA média; =MÁXIMO/=MÍNIMO o maior/menor; =CONT.NÚM conta só números; =CONT.VALORES conta tudo preenchido (use para contar nomes). Atalho: selecione e olhe a barra de status." },
    { k: ["referencia", "absoluta", "relativa", "cifrao", "f4", "travar"], t: "Referências ($ e F4)", a: "Relativa (A1) anda ao arrastar. Absoluta ($A$1) trava a célula — use para valores fixos como taxa de imposto. A tecla F4 alterna A1 → $A$1 → A$1 → $A1. Nunca digite o $ na mão." },
    { k: ["se", "condicao", "ses", "logica"], t: "Função SE", a: "=SE(condição; valor_se_verdadeiro; valor_se_falso). Texto vai entre aspas. Para vários casos use SES. Para combinar condições, E (todas) ou OU (uma). Ex.: =SE(B2>=7;\"Aprovado\";\"Reprovado\")." },
    { k: ["somase", "somases", "cont.se", "soma com condicao"], t: "SOMASE / SOMASES", a: "=SOMASE(onde_testar; critério; o_que_somar). Cuidado: no SOMASES o intervalo de soma vem PRIMEIRO. =CONT.SE conta com condição. Critérios aceitam \">1000\", \"<>Cancelado\", \"São*\"." },
    { k: ["procv", "vlookup", "buscar", "procx"], t: "PROCV e PROCX", a: "=PROCV(o_que_procurar; tabela; nº_da_coluna; FALSO) — sempre termine com FALSO (exato). O PROCV só busca na 1ª coluna e à direita. O PROCX (Microsoft 365) busca em qualquer direção. #N/D = não encontrou (cheque espaços e texto×número)." },
    { k: ["texto", "concatenar", "juntar", "arrumar", "esquerda", "maiuscula"], t: "Funções de texto", a: "=A2&\" \"&B2 junta textos. =ARRUMAR(A2) remove espaços sobrando (salva o PROCV!). =MAIÚSCULA/=MINÚSCULA mudam a caixa. =ESQUERDA(A2;3) pega caracteres." },
    { k: ["data", "hoje", "datadif", "vencimento", "dias"], t: "Datas", a: "Data é um número por baixo. =HOJE() data atual; =A2+30 daqui a 30 dias; =B2-A2 dias entre datas; =DATADIF(A2;HOJE();\"Y\") anos completos. Atalho Ctrl+; insere a data de hoje fixa." },
    { k: ["tabela", "filtro", "classificar", "ordenar"], t: "Tabelas (Ctrl+T)", a: "Selecione os dados e aperte Ctrl+T. Ganha filtros, classificação, formatação automática e expansão (fórmulas/gráficos se atualizam). É o hábito profissional nº1." },
    { k: ["formatacao condicional", "cor", "semaforo", "barras de dados", "duplicados"], t: "Formatação condicional", a: "Página Inicial → Formatação Condicional: pinta células conforme o valor (vermelho abaixo da meta), barras de dados, semáforos e destaque de duplicados. Dá vida a painéis." },
    { k: ["grafico", "pizza", "coluna", "linha"], t: "Gráficos", a: "Colunas/Barras para comparar categorias; Linhas para evolução no tempo; Pizza só com poucas fatias (até ~5) para mostrar participação. Dê um título que diga a conclusão." },
    { k: ["tabela dinamica", "dinamica", "resumir", "pivot"], t: "Tabela Dinâmica", a: "Resume milhares de linhas sem fórmula. Inserir → Tabela Dinâmica, e arraste: campo para LINHAS (agrupar) e valor para VALORES (somar). Pré-requisito: dados organizados. Mudou os dados? Botão direito → Atualizar." },
    { k: ["erro", "valor", "nome", "div", "ref"], t: "Erros do Excel", a: "##### = coluna estreita; #DIV/0! = dividiu por zero; #VALOR! = texto onde esperava número; #NOME? = nome de função errado; #N/D = PROCV não achou; #REF! = apagou célula usada. Use =SEERRO(...) para texto amigável." },
    { k: ["validacao", "lista suspensa", "proteger", "seerro"], t: "Blindar a planilha", a: "Validação de Dados (Dados → Validação) cria listas suspensas e limita o que pode ser digitado. SEERRO esconde erros feios. Proteger Planilha (Revisão) impede apagar fórmulas sem querer." },
    { k: ["atalho", "atalhos", "teclas"], t: "Atalhos", a: "Ctrl+B salvar · Ctrl+Z desfazer · Alt+= AutoSoma · Ctrl+; data de hoje · Ctrl+T Tabela · Ctrl+Shift+L filtros · Ctrl+Setas pular ao fim · Ctrl+Shift+V colar só valores · F4 alterna o $." },
    { k: ["salvar", "xlsx", "formato"], t: "Salvar", a: "Ctrl+B salva. O formato moderno é .xlsx (use .xls só para Excel muito antigo). Renomeie as abas com duplo-clique e dê cores para organizar." },
    { k: ["ia", "claude", "inteligencia artificial"], t: "IA + Excel", a: "Travou numa fórmula? Cole a estrutura da sua planilha numa IA e peça 'monte a fórmula que faz X'. Aqui na plataforma há o curso Domine o Claude — IA + Excel é combinação imbatível." },
  ];
  const SUGESTOES = ["Como usar o PROCV?", "Para que serve o $?", "Diferença de CONT.NÚM e CONT.VALORES", "Como fazer uma Tabela Dinâmica?", "O que é #N/D?", "Como usar o SE?", "SOMASE x SOMASES", "Atalhos essenciais"];
  const chatMensagens = document.getElementById("chatMensagens");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatSugestoes = document.getElementById("chatSugestoes");
  let ultimoTema = null;
  function normalizar(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function buscarResposta(perg) {
    const p = " " + normalizar(perg) + " ";
    if (/\b(oi|ola|opa|bom dia|boa tarde|boa noite)\b/.test(p) && perg.length < 30) return "Oi! 👋 Sou o tutor de Excel. Pergunta qualquer coisa: fórmulas, PROCV, $, SE, gráficos, tabela dinâmica, erros...";
    if (/\b(obrigad|valeu|show|top|massa)\b/.test(p) && perg.length < 40) return "Disponha! 😊 Agora vai praticar — Excel se aprende digitando, não lendo.";
    let melhor = null, pts = 0;
    KB.forEach((item) => {
      let s = 0;
      item.k.forEach((kw) => { if (p.includes(normalizar(kw))) s += kw.split(" ").length * 2 + (kw.length > 8 ? 1 : 0); });
      if (s > pts) { pts = s; melhor = item; }
    });
    if (melhor && pts >= 2) { ultimoTema = melhor; return "💡 " + melhor.t + "\n\n" + melhor.a; }
    if (ultimoTema && perg.length < 30 && /\b(e |isso|como assim|mais|exemplo)\b/.test(p)) return "Sobre " + ultimoTema.t + ": " + ultimoTema.a;
    return "Hmm, essa não peguei. 🤔 Tente outras palavras ou toque numa sugestão — domino: fórmulas, SOMA/SE/SOMASE, referências ($), PROCV/PROCX, texto, datas, tabelas, formatação condicional, gráficos, tabela dinâmica, erros e atalhos.";
  }
  function addBolha(de, texto) {
    const div = document.createElement("div");
    div.className = "msg " + (de === "eu" ? "msg-eu" : "msg-ia");
    div.textContent = texto;
    chatMensagens.appendChild(div); chatMensagens.scrollTop = chatMensagens.scrollHeight;
  }
  function salvarMsg(de, t) {
    estado.tutorHistorico.push({ de, t });
    if (estado.tutorHistorico.length > 60) estado.tutorHistorico = estado.tutorHistorico.slice(-60);
    salvar();
  }
  function renderSugestoes() {
    chatSugestoes.innerHTML = embaralhar(SUGESTOES).slice(0, 4).map((s) => `<button type="button" class="chip" data-sugestao="${s}">${s}</button>`).join("");
  }
  function enviarPergunta(p) {
    addBolha("eu", p); salvarMsg("eu", p); chatInput.value = "";
    setTimeout(() => { const r = buscarResposta(p); addBolha("ia", r); salvarMsg("ia", r); renderSugestoes(); }, 350);
  }
  if (chatForm) {
    if (estado.tutorHistorico.length) estado.tutorHistorico.forEach((m) => addBolha(m.de, m.t));
    else { const bv = "Oi! 👋 Sou o tutor de Excel do Império Digital. Pergunte QUALQUER coisa: fórmulas, PROCV, $, SE, gráficos, tabela dinâmica, erros... Toque numa sugestão ou escreva!"; addBolha("ia", bv); salvarMsg("ia", bv); }
    renderSugestoes();
    chatForm.addEventListener("submit", (ev) => { ev.preventDefault(); const p = chatInput.value.trim(); if (p) enviarPergunta(p); });
    chatSugestoes.addEventListener("click", (ev) => { const b = ev.target.closest("[data-sugestao]"); if (b) enviarPergunta(b.dataset.sugestao); });
    document.getElementById("chatLimpar").addEventListener("click", () => {
      estado.tutorHistorico = []; salvar(); chatMensagens.innerHTML = ""; ultimoTema = null;
      const m = "Conversa limpa! 🧹 Pode perguntar de novo."; addBolha("ia", m); salvarMsg("ia", m);
    });
  }

  /* ============================================================ CERTIFICADO ============================================================ */
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
  if (certImprimirBtn) certImprimirBtn.addEventListener("click", () => {
    if (!estado.nome) { const nome = prompt("Antes de imprimir, digite seu nome:"); if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); } }
    document.body.classList.add("imprimindo-cert"); window.print();
    setTimeout(() => document.body.classList.remove("imprimindo-cert"), 500);
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("imprimindo-cert"));
  function desenharCertificado(cb) {
    const fontes = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontes.then(() => {
      const c = document.createElement("canvas"); c.width = 1200; c.height = 850;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 1200, 850);
      grad.addColorStop(0, "#221E1A"); grad.addColorStop(1, "#1A1714");
      g.fillStyle = grad; g.fillRect(0, 0, 1200, 850);
      const halo = g.createRadialGradient(950, 80, 30, 950, 80, 500);
      halo.addColorStop(0, "rgba(46,158,82,.22)"); halo.addColorStop(1, "rgba(46,158,82,0)");
      g.fillStyle = halo; g.fillRect(0, 0, 1200, 850);
      g.strokeStyle = "#2E9E52"; g.lineWidth = 6; g.strokeRect(40, 40, 1120, 770);
      g.strokeStyle = "rgba(46,158,82,.35)"; g.lineWidth = 2; g.strokeRect(58, 58, 1084, 734);
      g.textAlign = "center";
      g.fillStyle = "#5BC47C"; g.font = "700 26px Outfit, sans-serif";
      g.fillText("👑  IMPÉRIO DIGITAL", 600, 140);
      g.fillStyle = "#B8AC9B"; g.font = "22px Outfit, sans-serif";
      g.fillText("CERTIFICADO DE CONCLUSÃO", 600, 185);
      g.fillStyle = "#F2EBE0"; g.font = "italic 600 64px Fraunces, Georgia, serif";
      g.fillText(estado.nome || "Aluno(a)", 600, 320);
      g.fillStyle = "#B8AC9B"; g.font = "26px Outfit, sans-serif";
      g.fillText("concluiu o curso", 600, 390);
      g.fillStyle = "#F2EBE0"; g.font = "600 34px Fraunces, Georgia, serif";
      g.fillText("“Excel do Zero ao Profissional”", 600, 445);
      g.fillStyle = "#B8AC9B"; g.font = "21px Outfit, sans-serif";
      g.fillText("Fórmulas · Referências · SE · SOMASE · PROCV/PROCX · Tabelas · Gráficos · Tabela Dinâmica", 600, 505);
      const d = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      g.fillText(`Concluído em ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`, 600, 580);
      g.fillStyle = "#2E9E52"; g.font = "700 24px Outfit, sans-serif";
      g.fillText("🌱 Primeiros passos   ·   🚀 Fórmulas e Funções   ·   🧠 Análise Profissional", 600, 660);
      g.fillStyle = "rgba(184,172,155,.7)"; g.font = "16px Outfit, sans-serif";
      g.fillText("Império Digital · plataforma de cursos independente", 600, 760);
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
    const a = document.createElement("a"); a.download = nome; a.href = href; a.click();
    if (revogar) setTimeout(() => URL.revokeObjectURL(href), 4000);
  }
  const certBaixarBtn = document.getElementById("certBaixarBtn");
  if (certBaixarBtn) certBaixarBtn.addEventListener("click", () => {
    desenharCertificado((c) => { baixarArquivo(c.toDataURL("image/png"), "certificado-excel-imperio-digital.png"); avisar("🏆 Certificado (imagem) baixado!"); });
  });
  const certPdfBtn = document.getElementById("certPdfBtn");
  if (certPdfBtn) certPdfBtn.addEventListener("click", () => {
    if (!estado.nome) { const nome = prompt("Antes de baixar, digite seu nome:"); if (nome && nome.trim()) { estado.nome = nome.trim().slice(0, 60); salvar(); atualizarCertificado(); } }
    desenharCertificado((c) => { const url = URL.createObjectURL(canvasParaPDF(c)); baixarArquivo(url, "certificado-excel-imperio-digital.pdf", true); avisar("📄 Certificado em PDF baixado!"); });
  });

  /* ============================================================ ACESSIBILIDADE ============================================================ */
  function aplicarFonte() { document.documentElement.style.fontSize = estado.fonte + "px"; }
  const fMenor = document.getElementById("fonteMenor");
  const fMaior = document.getElementById("fonteMaior");
  if (fMenor && fMaior) {
    fMenor.addEventListener("click", () => { estado.fonte = Math.max(14, estado.fonte - 1); aplicarFonte(); salvar(); });
    fMaior.addEventListener("click", () => { estado.fonte = Math.min(21, estado.fonte + 1); aplicarFonte(); salvar(); });
  }
  if (estado.fonte !== 16) aplicarFonte();

  const SENIOR_EXPLICACAO = {
    "m1-1": "<p><strong>Em palavras simples:</strong> o Excel é uma folha cheia de quadradinhos. Cada quadradinho é uma 'célula' e tem um endereço, como uma cadeira de cinema: a coluna (letra) e a linha (número). O quadradinho da coluna B com a linha 3 chama-se B3.</p>",
    "m1-2": "<p><strong>Em palavras simples:</strong> escreva uma informação em cada quadradinho — nome num, valor noutro. Se digitar um número e ele 'colar' na direita, está certo. Se colar na esquerda, o Excel achou que era texto e não vai conseguir somar.</p>",
    "m1-3": "<p><strong>Em palavras simples:</strong> deixe bonito e fácil de ler: cabeçalho em negrito, bordas e o R$ nos valores. Se aparecer #####, não é defeito — é a coluna estreita; basta alargar (duplo-clique na linha entre as letras das colunas).</p>",
    "m1-4": "<p><strong>Em palavras simples:</strong> aqui o Excel faz conta por você. Comece com o sinal de igual (=) e mande somar: =A1+B1. O segredo é usar os 'endereços' em vez dos números — se você mudar um valor, a conta se refaz sozinha.</p>",
    "m1-5": "<p><strong>Em palavras simples:</strong> salve sempre (Ctrl+B). Se errar, Ctrl+Z volta atrás — pode usar à vontade, não estraga nada. E não se assuste com os 'erros' (#DIV/0!, #N/D...): cada um tem um motivo simples de resolver.</p>",
    "m2-1": "<p><strong>Em palavras simples:</strong> decore 4 palavrinhas: SOMA (soma), MÉDIA (a média), MÁXIMO (o maior) e MÍNIMO (o menor). Dica: selecione vários números com o mouse e olhe lá embaixo — o Excel já mostra a soma e a média na hora.</p>",
    "m2-2": "<p><strong>Em palavras simples:</strong> ao copiar uma conta para baixo, o Excel ajusta os endereços sozinho. Mas se tem um valor fixo (uma taxa) que NÃO pode mudar, você 'prende' ele apertando F4 — aparecem cifrões ($) que significam 'não mexa nesta'.</p>",
    "m2-3": "<p><strong>Em palavras simples:</strong> a função SE faz a planilha decidir. É como dizer: 'SE a nota for 7 ou mais, escreva Aprovado; SE NÃO, escreva Reprovado'. Você dá a regra e o Excel preenche tudo.</p>",
    "m2-4": "<p><strong>Em palavras simples:</strong> às vezes você quer somar só uma parte: 'quanto vendi só no Sul?'. A função SOMASE soma apenas o que obedece a uma condição. Muito útil para relatórios.</p>",
    "m2-5": "<p><strong>Em palavras simples:</strong> o PROCV é um 'busca-pra-mim'. Você dá um código e ele vai numa tabela, encontra a linha certa e traz a informação (o preço). Regra de ouro: termine sempre com a palavra FALSO.</p>",
    "m2-6": "<p><strong>Em palavras simples:</strong> dá para juntar textos (nome + sobrenome) e fazer contas com datas. Como o Excel entende data como número, somar 30 a uma data te dá o vencimento daqui a um mês. =HOJE() escreve a data de hoje.</p>",
    "m3-1": "<p><strong>Em palavras simples:</strong> selecione seus dados e aperte Ctrl+T. Vira uma 'Tabela' bonita com setinhas no topo que deixam você filtrar (mostrar só o que interessa) e ordenar (do maior para o menor) com um clique.</p>",
    "m3-2": "<p><strong>Em palavras simples:</strong> dá para a célula mudar de cor sozinha. Por exemplo, tudo abaixo da meta fica vermelho automaticamente. O relatório fica fácil de entender só de bater o olho.</p>",
    "m3-3": "<p><strong>Em palavras simples:</strong> gráfico é a foto dos números. Para comparar coisas, use Colunas. Para mostrar crescimento mês a mês, use Linhas. Pizza só com poucas fatias. E dê um título que explique a conclusão.</p>",
    "m3-4": "<p><strong>Em palavras simples:</strong> a Tabela Dinâmica é mágica: resume milhares de linhas em segundos, sem fórmula nenhuma. Você só arrasta os campos: 'o que agrupar' e 'o que somar'. Parece difícil, mas é arrastar e soltar.</p>",
    "m3-5": "<p><strong>Em palavras simples:</strong> para a planilha não bagunçar, crie listinhas suspensas (a pessoa escolhe, não digita errado) e proteja as fórmulas. E lembre: travou? Peça ajuda à IA — tem um curso disso aqui na plataforma.</p>",
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

  /* ============================================================ VOZ ============================================================ */
  const sintese = window.speechSynthesis;
  let leitura = { fila: [], idx: 0, btn: null, parar: null, estado: "parado" };
  let vozFixa = null;
  function vozPortugues() {
    if (vozFixa) return vozFixa;
    const vozes = (sintese ? sintese.getVoices() : []).filter((v) => /^pt([-_]|$)/i.test(v.lang));
    if (!vozes.length) return null;
    if (estado.vozNome) { const s = vozes.find((v) => v.name === estado.vozNome); if (s) { vozFixa = s; return s; } }
    const nota = (v) => { const n = v.name.toLowerCase(); let s = 0; if (/br/i.test(v.lang)) s += 5; if (n.includes("google")) s += 4; if (/luciana|felipe|francisca|camila|thalita|antonio/.test(n)) s += 3; if (/natural|enhanced|premium|aprimorad|neural/.test(n)) s += 3; if (!v.localService) s += 1; return s; };
    vozFixa = vozes.sort((a, b) => nota(b) - nota(a) || a.name.localeCompare(b.name))[0];
    estado.vozNome = vozFixa.name; salvar(); return vozFixa;
  }
  if (sintese) { sintese.getVoices(); if (typeof sintese.addEventListener === "function") sintese.addEventListener("voiceschanged", () => { if (!vozFixa) vozPortugues(); }); }
  function textoDaEtapa(secao) {
    const clone = secao.cloneNode(true);
    clone.querySelectorAll("pre, button, input, select, .quiz-caixa, .ouvir-controles").forEach((e) => e.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function quebrarEmFrases(texto) {
    const frases = texto.match(/[^.!?…]+[.!?…]*/g) || [texto];
    const fila = [];
    frases.forEach((f) => { f = f.trim(); if (!f) return; while (f.length > 220) { const corte = f.lastIndexOf(",", 220); const p = corte > 60 ? f.slice(0, corte + 1) : f.slice(0, 220); fila.push(p.trim()); f = f.slice(p.length).trim(); } if (f) fila.push(f); });
    return fila;
  }
  function atualizarBotaoLeitura() {
    if (!leitura.btn) return;
    leitura.btn.textContent = leitura.estado === "falando" ? "⏸ Pausar" : leitura.estado === "pausado" ? "▶ Continuar" : "🔊 Ouvir esta etapa";
    if (leitura.parar) leitura.parar.classList.toggle("oculto", leitura.estado === "parado");
  }
  function pararLeitura() { if (!sintese) return; sintese.cancel(); leitura.estado = "parado"; leitura.fila = []; leitura.idx = 0; atualizarBotaoLeitura(); leitura.btn = null; leitura.parar = null; }
  function falarProxima() {
    if (leitura.idx >= leitura.fila.length) { leitura.estado = "parado"; atualizarBotaoLeitura(); return; }
    const u = new SpeechSynthesisUtterance(leitura.fila[leitura.idx]);
    u.lang = "pt-BR"; const voz = vozPortugues(); if (voz) u.voice = voz; u.rate = estado.vozVel || 1; u.pitch = 1.0;
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
      wrap.innerHTML = '<button type="button" class="ouvir-btn">🔊 Ouvir esta etapa</button><button type="button" class="ouvir-parar oculto" aria-label="Parar leitura">⏹ Parar</button><button type="button" class="ouvir-vel" aria-label="Velocidade da voz">⚡ ' + (estado.vozVel || 1) + 'x</button>';
      cab.appendChild(wrap);
      const btn = wrap.querySelector(".ouvir-btn");
      const parar = wrap.querySelector(".ouvir-parar");
      const vel = wrap.querySelector(".ouvir-vel");
      vel.addEventListener("click", () => {
        const i = VOZ_VELOCIDADES.indexOf(estado.vozVel || 1);
        estado.vozVel = VOZ_VELOCIDADES[(i + 1) % VOZ_VELOCIDADES.length]; salvar();
        document.querySelectorAll(".ouvir-vel").forEach((b) => { b.textContent = "⚡ " + estado.vozVel + "x"; });
        avisar("Velocidade da voz: " + estado.vozVel + "x");
        if (leitura.estado === "falando") { const idx = leitura.idx; sintese.cancel(); leitura.idx = idx; falarProxima(); }
      });
      btn.addEventListener("click", () => {
        if (leitura.btn === btn && leitura.estado === "falando") { sintese.pause(); leitura.estado = "pausado"; atualizarBotaoLeitura(); return; }
        if (leitura.btn === btn && leitura.estado === "pausado") { sintese.resume(); leitura.estado = "falando"; atualizarBotaoLeitura(); return; }
        pararLeitura();
        leitura.btn = btn; leitura.parar = parar;
        leitura.fila = quebrarEmFrases(textoDaEtapa(secao));
        leitura.idx = 0; leitura.estado = "falando"; atualizarBotaoLeitura(); falarProxima();
        avisar("🔊 Lendo em voz alta — pode bloquear a tela e só ouvir!");
      });
      parar.addEventListener("click", pararLeitura);
    });
  }

  /* ---------------- Inicialização ---------------- */
  function atualizarTudo() { atualizarModulos(); atualizarProgresso(); atualizarCertificado(); }
  atualizarContinuar(); atualizarTudo();
})();
