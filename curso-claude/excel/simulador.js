/* ============================================================
   IMPÉRIO DIGITAL — Praticar Excel (planilha interativa)
   Monta uma planilha de verdade dentro da tela e valida missões
   guiadas. Depende de motor.js (window.SimuladorExcel).
   ============================================================ */
(function () {
  "use strict";

  function pronto(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  pronto(function () {
    const raiz = document.getElementById("sim-app");
    if (!raiz || !window.SimuladorExcel) return;

    const { criarMotor, numParaCol } = window.SimuladorExcel;

    /* ---------------- missões guiadas ---------------- */
    const MISSOES = [
      {
        id: "juntar",
        titulo: "Juntar nome e sobrenome",
        nivel: "Texto",
        enunciado:
          "A planilha tem o <b>nome</b> na coluna A e o <b>sobrenome</b> na coluna B. " +
          "Na célula <b>C2</b>, escreva uma fórmula que junte os dois com um espaço no meio.",
        dica: 'Use o sinal <b>&</b> para grudar textos. O espaço é um texto: <code>" "</code>. Tente: <code>=A2&" "&B2</code>',
        solucao: '=A2&" "&B2',
        cols: 3,
        linhas: 5,
        dados: {
          A1: "Nome", B1: "Sobrenome", C1: "Nome completo",
          A2: "Maria", B2: "Souza",
          A3: "João", B3: "Lima",
          A4: "Ana", B4: "Dias",
        },
        alvos: [{ cel: "C2", esperado: "Maria Souza" }],
        depois:
          "Funcionou? Agora repita a ideia em <b>C3</b> e <b>C4</b> e veja a planilha juntar todos os nomes de uma vez. " +
          "É exatamente assim que se monta uma lista de e-mails ou crachás no trabalho.",
        selecao: "C2",
      },
      {
        id: "separar-nome",
        titulo: "Separar só o primeiro nome",
        nivel: "Texto",
        enunciado:
          "Agora ao contrário: a coluna A tem o <b>nome completo</b>. " +
          "Na célula <b>B2</b>, escreva uma fórmula que pegue só o <b>primeiro nome</b>.",
        dica:
          "Pegamos os caracteres da esquerda até o espaço. <code>LOCALIZAR(\" \";A2)</code> acha a posição do espaço; " +
          "tiramos 1 para não pegar o espaço. Tente: <code>=ESQUERDA(A2;LOCALIZAR(\" \";A2)-1)</code>",
        solucao: '=ESQUERDA(A2;LOCALIZAR(" ";A2)-1)',
        cols: 3,
        linhas: 5,
        dados: {
          A1: "Nome completo", B1: "Primeiro nome", C1: "Sobrenome",
          A2: "Maria Souza",
          A3: "João Lima",
          A4: "Ana Dias",
        },
        alvos: [{ cel: "B2", esperado: "Maria" }],
        depois:
          "Esse combo <b>ESQUERDA + LOCALIZAR</b> separa qualquer lista de nomes. " +
          "Quer ir além? Na coluna C tente puxar o sobrenome com " +
          "<code>=DIREITA(A2;NÚM.CARACT(A2)-LOCALIZAR(\" \";A2))</code>.",
        selecao: "B2",
      },
      {
        id: "soma",
        titulo: "Somar uma coluna de vendas",
        nivel: "Números",
        enunciado:
          "A coluna B tem as vendas de cada dia. Na célula <b>B6</b>, escreva uma fórmula que some todos os valores de <b>B2 até B5</b>.",
        dica: "Use a função SOMA com um intervalo: <code>=SOMA(B2:B5)</code>",
        solucao: "=SOMA(B2:B5)",
        cols: 2,
        linhas: 6,
        dados: {
          A1: "Dia", B1: "Vendas (R$)",
          A2: "Segunda", B2: "1200",
          A3: "Terça", B3: "980",
          A4: "Quarta", B4: "1540",
          A5: "Quinta", B5: "1100",
          A6: "Total",
        },
        alvos: [{ cel: "B6", esperado: "4820" }],
        depois:
          "Agora experimente <code>=MÉDIA(B2:B5)</code> em outra célula para a média diária, " +
          "ou <code>=MÁXIMO(B2:B5)</code> para descobrir o melhor dia.",
        selecao: "B6",
      },
      {
        id: "se",
        titulo: "Aprovar ou reprovar com SE",
        nivel: "Decisão",
        enunciado:
          "A coluna B tem a nota de cada aluno. Na célula <b>C2</b>, escreva uma fórmula que escreva " +
          "<b>Aprovado</b> se a nota for 7 ou mais, e <b>Reprovado</b> se for menos.",
        dica:
          'A função SE decide: <code>=SE(condição; se_verdadeiro; se_falso)</code>. ' +
          'Tente: <code>=SE(B2>=7;"Aprovado";"Reprovado")</code>',
        solucao: '=SE(B2>=7;"Aprovado";"Reprovado")',
        cols: 3,
        linhas: 5,
        dados: {
          A1: "Aluno", B1: "Nota", C1: "Situação",
          A2: "Bruno", B2: "8",
          A3: "Carla", B3: "5",
          A4: "Diego", B4: "7",
        },
        alvos: [{ cel: "C2", esperado: "Aprovado" }],
        depois:
          "Repita em C3 e C4 e veja o resultado mudar sozinho conforme a nota. " +
          "O SE é o coração das planilhas inteligentes.",
        selecao: "C2",
      },
      {
        id: "procv",
        titulo: "Buscar um preço com PROCV",
        nivel: "Busca",
        enunciado:
          "A tabela A2:B5 tem produtos e preços. Na célula <b>E2</b>, busque o preço do produto que está em <b>D2</b> (Café).",
        dica:
          "PROCV procura na primeira coluna e devolve o valor de outra coluna da mesma linha: " +
          "<code>=PROCV(D2;A2:B5;2;FALSO)</code>",
        solucao: "=PROCV(D2;A2:B5;2;FALSO)",
        cols: 5,
        linhas: 5,
        dados: {
          A1: "Produto", B1: "Preço", D1: "Buscar", E1: "Preço achado",
          A2: "Café", B2: "18",
          A3: "Açúcar", B3: "5",
          A4: "Leite", B4: "7",
          A5: "Filtro", B5: "9",
          D2: "Café",
        },
        alvos: [{ cel: "E2", esperado: "18" }],
        depois:
          "Troque o conteúdo de <b>D2</b> por <i>Leite</i> ou <i>Filtro</i> e veja o preço mudar na hora. " +
          "É assim que se monta uma consulta de catálogo.",
        selecao: "E2",
      },
      {
        id: "contse",
        titulo: "Contar por categoria (CONT.SE)",
        nivel: "Condição",
        enunciado:
          "A coluna A tem a região de cada venda. Na célula <b>B2</b>, conte quantas vendas foram da região <b>Sul</b>.",
        dica: 'CONT.SE conta as células que batem com um critério: <code>=CONT.SE(A2:A6;"Sul")</code>',
        solucao: '=CONT.SE(A2:A6;"Sul")',
        cols: 2,
        linhas: 6,
        dados: {
          A1: "Região", B1: "Qtd no Sul",
          A2: "Sul", A3: "Norte", A4: "Sul", A5: "Sul", A6: "Norte",
        },
        alvos: [{ cel: "B2", esperado: "3" }],
        depois: "Troque um “Norte” por “Sul” em qualquer linha e veja a contagem mudar na hora.",
        selecao: "B2",
      },
      {
        id: "somase",
        titulo: "Somar com uma condição (SOMASE)",
        nivel: "Condição",
        enunciado:
          "A coluna A tem a região e a B o valor da venda. Na célula <b>D2</b>, some apenas as vendas da região <b>Sul</b>.",
        dica:
          "SOMASE soma os valores cujo critério bate: <code>=SOMASE(A2:A6;\"Sul\";B2:B6)</code> " +
          "(intervalo do critério; critério; intervalo a somar).",
        solucao: '=SOMASE(A2:A6;"Sul";B2:B6)',
        cols: 4,
        linhas: 6,
        dados: {
          A1: "Região", B1: "Valor", D1: "Total Sul",
          A2: "Sul", B2: "100",
          A3: "Norte", B3: "200",
          A4: "Sul", B4: "150",
          A5: "Sul", B5: "50",
          A6: "Norte", B6: "300",
        },
        alvos: [{ cel: "D2", esperado: "300" }],
        depois: "É assim que se soma só o que interessa: vendas de um vendedor, de um mês, de uma categoria...",
        selecao: "D2",
      },
      {
        id: "somases",
        titulo: "Somar com vários critérios (SOMASES)",
        nivel: "Condição",
        enunciado:
          "Agora some o <b>valor</b> (coluna C) só quando a região (A) for <b>Sul</b> <i>e</i> o produto (B) for <b>Café</b>. Coloque a fórmula em <b>E2</b>.",
        dica:
          "No SOMASES o intervalo a somar vem primeiro, depois os pares (intervalo; critério): " +
          "<code>=SOMASES(C2:C5;A2:A5;\"Sul\";B2:B5;\"Café\")</code>",
        solucao: '=SOMASES(C2:C5;A2:A5;"Sul";B2:B5;"Café")',
        cols: 5,
        linhas: 5,
        dados: {
          A1: "Região", B1: "Produto", C1: "Valor", E1: "Sul + Café",
          A2: "Sul", B2: "Café", C2: "100",
          A3: "Sul", B3: "Filtro", C3: "50",
          A4: "Norte", B4: "Café", C4: "200",
          A5: "Sul", B5: "Café", C5: "80",
        },
        alvos: [{ cel: "E2", esperado: "180" }],
        depois: "Dois filtros ao mesmo tempo — o jeito profissional de fatiar uma base de dados.",
        selecao: "E2",
      },
      {
        id: "procx",
        titulo: "Busca moderna (PROCX)",
        nivel: "Busca",
        enunciado:
          "PROCX é a versão nova e mais simples do PROCV. Na célula <b>E2</b>, busque o preço do produto que está em <b>D2</b> (Filtro).",
        dica:
          "A ordem é: o que procurar; onde procurar; o que devolver. " +
          "<code>=PROCX(D2;A2:A4;B2:B4)</code>",
        solucao: "=PROCX(D2;A2:A4;B2:B4)",
        cols: 5,
        linhas: 4,
        dados: {
          A1: "Produto", B1: "Preço", D1: "Buscar", E1: "Preço",
          A2: "Café", B2: "18",
          A3: "Filtro", B3: "9",
          A4: "Leite", B4: "7",
          D2: "Filtro",
        },
        alvos: [{ cel: "E2", esperado: "9" }],
        depois: "Mais curta que o PROCV e não quebra se você inserir colunas. Se sua versão do Excel tiver PROCX, prefira ela.",
        selecao: "E2",
      },
      {
        id: "porcentagem",
        titulo: "Calcular porcentagem",
        nivel: "Números",
        enunciado:
          "A conta do almoço está em <b>A2</b>. Na célula <b>B2</b>, calcule <b>15%</b> de gorjeta sobre esse valor.",
        dica:
          "O sinal % divide por 100. Então 15% vale 0,15. Multiplique: <code>=A2*15%</code> (ou <code>=A2*0,15</code>).",
        solucao: "=A2*15%",
        cols: 2,
        linhas: 3,
        dados: { A1: "Conta (R$)", B1: "Gorjeta 15%", A2: "80" },
        alvos: [{ cel: "B2", esperado: "12" }],
        depois: "Para somar a gorjeta ao total: <code>=A2+A2*15%</code> ou <code>=A2*1,15</code>. Teste!",
        selecao: "B2",
      },
      {
        id: "email",
        titulo: "Montar e-mail a partir do nome",
        nivel: "Texto",
        enunciado:
          "RH pediu o e-mail no padrão <b>nome.sobrenome@empresa.com</b>, tudo minúsculo. " +
          "Com o nome em A2 e o sobrenome em B2, monte o e-mail em <b>C2</b>.",
        dica:
          'Junte com & e deixe minúsculo com MINÚSCULA: ' +
          '<code>=MINÚSCULA(A2&"."&B2&"@empresa.com")</code>',
        solucao: '=MINÚSCULA(A2&"."&B2&"@empresa.com")',
        cols: 3,
        linhas: 4,
        dados: {
          A1: "Nome", B1: "Sobrenome", C1: "E-mail",
          A2: "Maria", B2: "Souza",
          A3: "João", B3: "Lima",
        },
        alvos: [{ cel: "C2", esperado: "maria.souza@empresa.com" }],
        depois: "Repita em C3 e gere a lista inteira de e-mails da equipe em segundos.",
        selecao: "C2",
      },
      {
        id: "livre",
        titulo: "Planilha livre (sem missão)",
        nivel: "Livre",
        enunciado:
          "Aqui é seu laboratório: digite o que quiser em qualquer célula. " +
          "Comece uma fórmula com <b>=</b>. Bom para testar tudo que você aprendeu.",
        dica:
          "Ideias para testar: <code>=2+3*4</code>, <code>=SOMA(A1:A4)</code>, " +
          "<code>=MAIÚSCULA(\"olá\")</code>, <code>=HOJE()</code>",
        solucao: null,
        cols: 5,
        linhas: 8,
        dados: { A1: "10", A2: "20", A3: "30", A4: "40" },
        alvos: [],
        depois: "",
        selecao: "B1",
      },
    ];

    /* ---------------- estado ---------------- */
    let missaoAtual = MISSOES[0];
    let dados = {};        // { A1: "conteúdo bruto" }
    let selecionada = null; // "C2"
    let resolvida = false;

    /* ---------------- elementos ---------------- */
    raiz.innerHTML = `
      <div class="sim-missoes" id="sim-missoes"></div>
      <div class="sim-painel">
        <div class="sim-tarefa" id="sim-tarefa"></div>
        <div class="sim-barra">
          <span class="sim-barra-cel" id="sim-cel">A1</span>
          <input class="sim-barra-input" id="sim-input" type="text"
                 inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                 placeholder="Toque numa célula e digite aqui. Fórmulas começam com =" />
          <button class="sim-ok" id="sim-ok" type="button" aria-label="Confirmar">✓</button>
        </div>
        <div class="sim-grade-wrap"><table class="sim-grade" id="sim-grade"></table></div>
        <div class="sim-acoes">
          <button class="btn btn-fantasma sim-mini" id="sim-dica" type="button">💡 Dica</button>
          <button class="btn btn-fantasma sim-mini" id="sim-solucao" type="button">👁 Ver resposta</button>
          <button class="btn btn-fantasma sim-mini" id="sim-limpar" type="button">↺ Reiniciar</button>
        </div>
        <div class="sim-feedback" id="sim-feedback" aria-live="polite"></div>
      </div>
    `;

    const elMissoes = raiz.querySelector("#sim-missoes");
    const elTarefa = raiz.querySelector("#sim-tarefa");
    const elCel = raiz.querySelector("#sim-cel");
    const elInput = raiz.querySelector("#sim-input");
    const elOk = raiz.querySelector("#sim-ok");
    const elGrade = raiz.querySelector("#sim-grade");
    const elFeedback = raiz.querySelector("#sim-feedback");
    const elDica = raiz.querySelector("#sim-dica");
    const elSolucao = raiz.querySelector("#sim-solucao");
    const elLimpar = raiz.querySelector("#sim-limpar");

    /* ---------------- abas de missão ---------------- */
    function montarAbas() {
      elMissoes.innerHTML = "";
      MISSOES.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sim-aba" + (m === missaoAtual ? " ativa" : "");
        b.innerHTML = `<span class="sim-aba-nivel">${m.nivel}</span><span>${m.titulo}</span>`;
        b.addEventListener("click", () => carregar(m));
        elMissoes.appendChild(b);
      });
    }

    /* ---------------- carregar missão ---------------- */
    function carregar(m) {
      missaoAtual = m;
      dados = Object.assign({}, m.dados);
      resolvida = false;
      selecionada = m.selecao || "A1";
      elTarefa.innerHTML =
        `<h3 class="sim-tarefa-titulo">${m.titulo}</h3>` +
        `<p class="sim-tarefa-texto">${m.enunciado}</p>`;
      elFeedback.className = "sim-feedback";
      elFeedback.innerHTML = "";
      elSolucao.style.display = m.solucao ? "" : "none";
      elDica.style.display = m.dica ? "" : "none";
      montarAbas();
      renderizar();
      selecionar(selecionada);
    }

    /* ---------------- render da grade ---------------- */
    function renderizar() {
      const motor = criarMotor(dados);
      const cols = missaoAtual.cols, linhas = missaoAtual.linhas;
      let html = "<thead><tr><th class='sim-canto'></th>";
      for (let c = 1; c <= cols; c++) html += `<th>${numParaCol(c)}</th>`;
      html += "</tr></thead><tbody>";
      for (let r = 1; r <= linhas; r++) {
        html += `<tr><th class="sim-num">${r}</th>`;
        for (let c = 1; c <= cols; c++) {
          const ref = numParaCol(c) + r;
          const bruto = dados[ref];
          const temFormula = typeof bruto === "string" && bruto[0] === "=";
          let mostra = motor.resultado(ref);
          const ehNum = mostra !== "" && !isNaN(Number(mostra.replace(",", ".")));
          const sel = ref === selecionada ? " sel" : "";
          const fcls = temFormula ? " temf" : "";
          const ncls = ehNum ? " num" : "";
          html += `<td class="sim-cel${sel}${fcls}${ncls}" data-ref="${ref}">${escapar(mostra)}</td>`;
        }
        html += "</tr>";
      }
      html += "</tbody>";
      elGrade.innerHTML = html;
    }

    function escapar(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* ---------------- seleção ---------------- */
    function selecionar(ref) {
      selecionada = ref;
      elCel.textContent = ref;
      elInput.value = dados[ref] !== undefined && dados[ref] !== null ? dados[ref] : "";
      elGrade.querySelectorAll(".sim-cel").forEach((td) => {
        td.classList.toggle("sel", td.dataset.ref === ref);
      });
    }

    function comprometer() {
      if (!selecionada) return;
      const v = elInput.value;
      if (v === "") delete dados[selecionada];
      else dados[selecionada] = v;
      renderizar();
      selecionar(selecionada);
      verificar();
    }

    /* ---------------- verificação de missão ---------------- */
    function verificar() {
      if (!missaoAtual.alvos || !missaoAtual.alvos.length) return;
      const motor = criarMotor(dados);
      const faltam = [];
      missaoAtual.alvos.forEach((a) => {
        const got = motor.resultado(a.cel);
        if (norm(got) !== norm(a.esperado)) faltam.push(a);
      });
      if (faltam.length === 0) {
        if (!resolvida) festejar();
        resolvida = true;
        elFeedback.className = "sim-feedback ok";
        elFeedback.innerHTML =
          `✅ <b>Mandou bem!</b> A fórmula funcionou de verdade. ` +
          (missaoAtual.depois ? `<br>${missaoAtual.depois}` : "");
      } else {
        elFeedback.className = "sim-feedback";
        const a = faltam[0];
        const got = motor.resultado(a.cel);
        if (got && got !== "") {
          elFeedback.innerHTML =
            `Quase! Em <b>${a.cel}</b> apareceu “${escapar(got)}”, mas o esperado era “${escapar(a.esperado)}”. ` +
            `Revise a fórmula ou toque em <b>💡 Dica</b>.`;
        }
      }
    }
    function norm(s) {
      return String(s).trim().toLowerCase();
    }

    function festejar() {
      if (typeof window.confete === "function") { try { window.confete(); } catch (e) {} }
    }

    /* ---------------- eventos ---------------- */
    elGrade.addEventListener("click", (ev) => {
      const td = ev.target.closest(".sim-cel");
      if (!td) return;
      selecionar(td.dataset.ref);
      elInput.focus();
      try { elInput.setSelectionRange(elInput.value.length, elInput.value.length); } catch (e) {}
    });

    elOk.addEventListener("click", comprometer);
    elInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        comprometer();
        descerSelecao();
      }
    });
    elInput.addEventListener("blur", comprometer);

    function descerSelecao() {
      if (!selecionada) return;
      const m = /^([A-Z]+)(\d+)$/.exec(selecionada);
      if (!m) return;
      const prox = m[1] + (parseInt(m[2], 10) + 1);
      const existe = elGrade.querySelector(`[data-ref="${prox}"]`);
      if (existe) selecionar(prox);
    }

    elDica.addEventListener("click", () => {
      elFeedback.className = "sim-feedback dica";
      elFeedback.innerHTML = `💡 ${missaoAtual.dica}`;
    });
    elSolucao.addEventListener("click", () => {
      if (!missaoAtual.solucao) return;
      const alvo = missaoAtual.alvos[0];
      if (alvo) {
        dados[alvo.cel] = missaoAtual.solucao;
        renderizar();
        selecionar(alvo.cel);
        verificar();
      }
      elFeedback.className = "sim-feedback dica";
      elFeedback.innerHTML =
        `👁 Resposta usada: <code>${escapar(missaoAtual.solucao)}</code>. ` +
        `Tente apagar e digitar você mesmo para fixar.`;
    });
    elLimpar.addEventListener("click", () => carregar(missaoAtual));

    /* ---------------- iniciar ---------------- */
    carregar(MISSOES[0]);
  });
})();
