/* ============================================================
   IMPÉRIO DIGITAL — Projeto Final do curso de Excel
   Estudo de caso guiado: o aluno monta um relatório de vendas
   do zero, passo a passo, e ao concluir libera o certificado.
   Depende de motor.js (window.SimuladorExcel) e, opcionalmente,
   de window.cursoExcel (integração com o certificado).
   ============================================================ */
(function () {
  "use strict";

  function pronto(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  pronto(function () {
    const raiz = document.getElementById("projeto-app");
    if (!raiz || !window.SimuladorExcel) return;

    const { criarMotor, numParaCol } = window.SimuladorExcel;
    const CHAVE = "imperiodigital.excel.projeto.v1";

    /* ---------------- definição do projeto ---------------- */
    const COLS = 5, LINHAS = 11;
    const BASE = {
      A1: "Produto", B1: "Qtd", C1: "Preço (R$)", D1: "Total (R$)", E1: "Situação",
      A2: "Café Tradicional", B2: "40", C2: "18",
      A3: "Café Gourmet", B3: "25", C3: "32",
      A4: "Filtro nº 103", B4: "60", C4: "9",
      A5: "Cafeteira", B5: "8", C5: "150",
      A8: "Faturamento total",
      A9: "Ticket médio",
      A10: "Maior venda",
      A11: "Produtos na meta (≥ R$ 700)",
    };

    const PASSOS = [
      {
        titulo: "1. Complete a tabela com a última venda",
        instrucao:
          "Toda planilha começa pelos dados. A loja também vendeu <b>Açúcar</b> esta semana. " +
          "Na <b>linha 6</b>, digite: em <b>A6</b> escreva <i>Açúcar</i>, em <b>B6</b> a quantidade <b>30</b> e em <b>C6</b> o preço <b>6</b>.",
        dica: "Toque na célula A6, digite Açúcar e confirme. Depois faça B6 = 30 e C6 = 6. Texto vai para a esquerda, número para a direita — é assim que você confere se digitou número de verdade.",
        alvos: [{ cel: "A6", esperado: "Açúcar" }, { cel: "B6", esperado: "30" }, { cel: "C6", esperado: "6" }],
        sol: { A6: "Açúcar", B6: "30", C6: "6" },
        foco: "A6",
      },
      {
        titulo: "2. Calcule o total da primeira venda",
        instrucao:
          "O total de cada linha é a <b>quantidade × preço</b>. Em <b>D2</b>, escreva uma fórmula que multiplique " +
          "<b>B2</b> por <b>C2</b>.",
        dica: 'Fórmulas começam com =. Use o asterisco para multiplicar: <code>=B2*C2</code>. Vai dar 720.',
        alvos: [{ cel: "D2", esperado: "720" }],
        sol: { D2: "=B2*C2" },
        foco: "D2",
      },
      {
        titulo: "3. Repita o cálculo nas outras linhas",
        instrucao:
          "Agora preencha <b>D3, D4, D5 e D6</b> com a mesma ideia da linha 2. Repare que, ao mudar de linha, " +
          "os números da fórmula acompanham sozinhos (B3*C3, B4*C4...). Isso se chama <b>referência relativa</b>.",
        dica: "Em D3 escreva =B3*C3, em D4 =B4*C4, e assim por diante até D6. É exatamente o que o Excel faz quando você arrasta a alça da célula para baixo.",
        alvos: [
          { cel: "D3", esperado: "800" }, { cel: "D4", esperado: "540" },
          { cel: "D5", esperado: "1200" }, { cel: "D6", esperado: "180" },
        ],
        sol: { D3: "=B3*C3", D4: "=B4*C4", D5: "=B5*C5", D6: "=B6*C6" },
        foco: "D3",
      },
      {
        titulo: "4. Some o faturamento total",
        instrucao:
          "Em <b>D8</b> (ao lado de “Faturamento total”), escreva uma fórmula que some todos os totais de <b>D2 até D6</b>.",
        dica: "Use a função SOMA com o intervalo: <code>=SOMA(D2:D6)</code>. O resultado é 3440.",
        alvos: [{ cel: "D8", esperado: "3440" }],
        sol: { D8: "=SOMA(D2:D6)" },
        foco: "D8",
      },
      {
        titulo: "5. Descubra o ticket médio",
        instrucao:
          "Em <b>D9</b>, calcule a <b>média</b> dos totais de <b>D2 até D6</b>. Esse é o valor médio por produto vendido.",
        dica: "A função é MÉDIA: <code>=MÉDIA(D2:D6)</code>. Vai dar 688.",
        alvos: [{ cel: "D9", esperado: "688" }],
        sol: { D9: "=MÉDIA(D2:D6)" },
        foco: "D9",
      },
      {
        titulo: "6. Encontre a maior venda",
        instrucao:
          "Em <b>D10</b>, descubra o <b>maior</b> total entre <b>D2 e D6</b> — o produto que mais faturou.",
        dica: "A função MÁXIMO devolve o maior valor de um intervalo: <code>=MÁXIMO(D2:D6)</code>. São 1200.",
        alvos: [{ cel: "D10", esperado: "1200" }],
        sol: { D10: "=MÁXIMO(D2:D6)" },
        foco: "D10",
      },
      {
        titulo: "7. Classifique a primeira venda",
        instrucao:
          "A meta de faturamento por produto é <b>R$ 700</b>. Em <b>E2</b>, escreva uma fórmula que mostre " +
          "<b>Bateu a meta</b> quando o total (D2) for 700 ou mais, e <b>Abaixo</b> quando for menos.",
        dica: 'A função SE decide: <code>=SE(D2>=700;"Bateu a meta";"Abaixo")</code>. Atenção às aspas nos textos.',
        alvos: [{ cel: "E2", esperado: "Bateu a meta" }],
        sol: { E2: '=SE(D2>=700;"Bateu a meta";"Abaixo")' },
        foco: "E2",
      },
      {
        titulo: "8. Classifique as demais vendas",
        instrucao:
          "Preencha <b>E3, E4, E5 e E6</b> com a mesma fórmula de decisão, trocando a linha. " +
          "Veja o texto mudar sozinho conforme cada total bate ou não a meta.",
        dica: 'Em E3 use =SE(D3>=700;"Bateu a meta";"Abaixo") e repita até E6, sempre acompanhando o número da linha.',
        alvos: [
          { cel: "E3", esperado: "Bateu a meta" }, { cel: "E4", esperado: "Abaixo" },
          { cel: "E5", esperado: "Bateu a meta" }, { cel: "E6", esperado: "Abaixo" },
        ],
        sol: {
          E3: '=SE(D3>=700;"Bateu a meta";"Abaixo")',
          E4: '=SE(D4>=700;"Bateu a meta";"Abaixo")',
          E5: '=SE(D5>=700;"Bateu a meta";"Abaixo")',
          E6: '=SE(D6>=700;"Bateu a meta";"Abaixo")',
        },
        foco: "E3",
      },
      {
        titulo: "9. Conte quantos bateram a meta",
        instrucao:
          "Para fechar o relatório, em <b>D11</b> conte quantos produtos têm o texto <b>Bateu a meta</b> na coluna E (de E2 a E6).",
        dica: 'A função CONT.SE conta com condição: <code>=CONT.SE(E2:E6;"Bateu a meta")</code>. O resultado é 3.',
        alvos: [{ cel: "D11", esperado: "3" }],
        sol: { D11: '=CONT.SE(E2:E6;"Bateu a meta")' },
        foco: "D11",
      },
    ];

    /* ---------------- estado ---------------- */
    let dados = Object.assign({}, BASE);
    let passoIdx = 0;
    let selecionada = "A6";

    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (salvo && typeof salvo === "object") {
        if (salvo.dados) dados = Object.assign({}, BASE, salvo.dados);
        if (typeof salvo.passo === "number") passoIdx = salvo.passo;
      }
    } catch (e) {}
    function salvar() {
      try { localStorage.setItem(CHAVE, JSON.stringify({ dados, passo: passoIdx })); } catch (e) {}
    }

    /* ---------------- montagem ---------------- */
    raiz.innerHTML = `
      <div class="proj-cabecalho">
        <div class="proj-prog"><div class="proj-prog-fill" id="proj-fill"></div></div>
        <span class="proj-prog-txt" id="proj-prog-txt"></span>
      </div>
      <div class="sim-painel">
        <div class="sim-tarefa" id="proj-tarefa"></div>
        <div class="sim-barra">
          <span class="sim-barra-cel" id="proj-cel">A6</span>
          <input class="sim-barra-input" id="proj-input" type="text"
                 inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                 placeholder="Toque numa célula e digite aqui. Fórmulas começam com =" />
          <button class="sim-ok" id="proj-ok" type="button" aria-label="Confirmar">✓</button>
        </div>
        <div class="sim-grade-wrap"><table class="sim-grade" id="proj-grade"></table></div>
        <div class="sim-acoes">
          <button class="btn btn-primario sim-mini" id="proj-verificar" type="button">✓ Conferir e avançar</button>
          <button class="btn btn-fantasma sim-mini" id="proj-dica" type="button">💡 Dica</button>
          <button class="btn btn-fantasma sim-mini" id="proj-sol" type="button">👁 Ver resposta</button>
        </div>
        <div class="sim-feedback" id="proj-feedback" aria-live="polite"></div>
        <button class="btn btn-fantasma sim-mini proj-recomecar" id="proj-recomecar" type="button">↺ Recomeçar o projeto do zero</button>
      </div>
    `;

    const elFill = raiz.querySelector("#proj-fill");
    const elProgTxt = raiz.querySelector("#proj-prog-txt");
    const elTarefa = raiz.querySelector("#proj-tarefa");
    const elCel = raiz.querySelector("#proj-cel");
    const elInput = raiz.querySelector("#proj-input");
    const elOk = raiz.querySelector("#proj-ok");
    const elGrade = raiz.querySelector("#proj-grade");
    const elVerificar = raiz.querySelector("#proj-verificar");
    const elDica = raiz.querySelector("#proj-dica");
    const elSol = raiz.querySelector("#proj-sol");
    const elFeedback = raiz.querySelector("#proj-feedback");
    const elRecomecar = raiz.querySelector("#proj-recomecar");

    function escapar(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* ---------------- render ---------------- */
    function renderGrade() {
      const motor = criarMotor(dados);
      let html = "<thead><tr><th class='sim-canto'></th>";
      for (let c = 1; c <= COLS; c++) html += `<th>${numParaCol(c)}</th>`;
      html += "</tr></thead><tbody>";
      for (let r = 1; r <= LINHAS; r++) {
        html += `<tr><th class="sim-num">${r}</th>`;
        for (let c = 1; c <= COLS; c++) {
          const ref = numParaCol(c) + r;
          const bruto = dados[ref];
          const temFormula = typeof bruto === "string" && bruto[0] === "=";
          const mostra = motor.resultado(ref);
          const ehNum = mostra !== "" && !isNaN(Number(String(mostra).replace(",", ".")));
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

    function selecionar(ref) {
      selecionada = ref;
      elCel.textContent = ref;
      elInput.value = dados[ref] !== undefined && dados[ref] !== null ? dados[ref] : "";
      elGrade.querySelectorAll(".sim-cel").forEach((td) => td.classList.toggle("sel", td.dataset.ref === ref));
    }

    function comprometer() {
      if (!selecionada) return;
      const v = elInput.value;
      if (v === "") delete dados[selecionada];
      else dados[selecionada] = v;
      salvar();
      renderGrade();
      selecionar(selecionada);
    }

    function renderPasso() {
      const total = PASSOS.length;
      if (passoIdx >= total) { renderConcluido(); return; }
      const p = PASSOS[passoIdx];
      elFill.style.width = Math.round((passoIdx / total) * 100) + "%";
      elProgTxt.textContent = `Passo ${passoIdx + 1} de ${total}`;
      elTarefa.innerHTML =
        `<h3 class="sim-tarefa-titulo">${p.titulo}</h3>` +
        `<p class="sim-tarefa-texto">${p.instrucao}</p>`;
      elFeedback.className = "sim-feedback";
      elFeedback.innerHTML = "";
      elVerificar.style.display = "";
      elDica.style.display = "";
      elSol.style.display = "";
      renderGrade();
      if (p.foco) selecionar(p.foco); else selecionar(selecionada);
    }

    function norm(s) { return String(s).trim().toLowerCase(); }

    function verificar() {
      const p = PASSOS[passoIdx];
      const motor = criarMotor(dados);
      const faltam = p.alvos.filter((a) => norm(motor.resultado(a.cel)) !== norm(a.esperado));
      if (faltam.length === 0) {
        passoIdx++;
        salvar();
        if (passoIdx >= PASSOS.length) {
          if (typeof window.confete === "function") { try { window.confete(); } catch (e) {} }
          renderConcluido();
        } else {
          elFeedback.className = "sim-feedback ok";
          elFeedback.innerHTML = "✅ Boa! Passo concluído. Vamos para o próximo.";
          setTimeout(renderPasso, 700);
        }
      } else {
        const a = faltam[0];
        const got = motor.resultado(a.cel);
        elFeedback.className = "sim-feedback";
        elFeedback.innerHTML = got && got !== ""
          ? `Quase! Em <b>${a.cel}</b> apareceu “${escapar(got)}”, mas o esperado era “${escapar(a.esperado)}”. Revise ou toque em <b>💡 Dica</b>.`
          : `Ainda falta preencher <b>${faltam.map((x) => x.cel).join(", ")}</b>. Toque em <b>💡 Dica</b> se precisar.`;
      }
    }

    function renderConcluido() {
      elFill.style.width = "100%";
      elProgTxt.textContent = "Projeto concluído 🎉";
      elTarefa.innerHTML =
        `<h3 class="sim-tarefa-titulo">🎉 Você construiu um relatório de vendas completo!</h3>` +
        `<p class="sim-tarefa-texto">Do zero, você digitou os dados, calculou totais com multiplicação, somou o faturamento, ` +
        `tirou a média, achou a maior venda, classificou cada produto com a função SE e contou quantos bateram a meta. ` +
        `Isso é exatamente o tipo de planilha que se usa no trabalho de verdade.</p>`;
      elVerificar.style.display = "none";
      elDica.style.display = "none";
      elSol.style.display = "none";
      elFeedback.className = "sim-feedback ok";
      elFeedback.innerHTML = "✅ Projeto final concluído — esse passo já está marcado no seu certificado.";
      renderGrade();
      if (window.cursoExcel && typeof window.cursoExcel.concluirProjeto === "function") {
        try { window.cursoExcel.concluirProjeto(); } catch (e) {}
      }
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
      if (ev.key === "Enter") { ev.preventDefault(); comprometer(); descer(); }
    });
    elInput.addEventListener("blur", comprometer);
    function descer() {
      const m = /^([A-Z]+)(\d+)$/.exec(selecionada);
      if (!m) return;
      const prox = m[1] + (parseInt(m[2], 10) + 1);
      if (elGrade.querySelector(`[data-ref="${prox}"]`)) selecionar(prox);
    }

    elVerificar.addEventListener("click", () => { comprometer(); verificar(); });
    elDica.addEventListener("click", () => {
      elFeedback.className = "sim-feedback dica";
      elFeedback.innerHTML = "💡 " + PASSOS[passoIdx].dica;
    });
    elSol.addEventListener("click", () => {
      const p = PASSOS[passoIdx];
      Object.keys(p.sol).forEach((cel) => { dados[cel] = p.sol[cel]; });
      salvar();
      renderGrade();
      selecionar(p.foco || selecionada);
      elFeedback.className = "sim-feedback dica";
      elFeedback.innerHTML = "👁 Respostas preenchidas. Toque em <b>✓ Conferir e avançar</b> — e tente refazer sozinho depois para fixar.";
    });
    elRecomecar.addEventListener("click", () => {
      if (!confirm("Recomeçar o projeto do zero? Você vai perder o preenchimento atual.")) return;
      dados = Object.assign({}, BASE);
      passoIdx = 0;
      salvar();
      renderPasso();
    });

    /* ---------------- iniciar ---------------- */
    renderPasso();
  });
})();
