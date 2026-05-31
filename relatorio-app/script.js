/* ===========================================================
   Gerador de Relatório — lógica
   Fonte de dados: arquivos Excel (.xlsx/.xls) ou CSV — lidos no
   próprio navegador com a biblioteca SheetJS (XLSX). Também aceita
   texto colado como alternativa.
   Os arquivos NÃO são enviados a nenhum servidor.
   =========================================================== */

const els = {
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  fileList: document.getElementById('fileList'),
  input: document.getElementById('inputText'),
  generate: document.getElementById('generateBtn'),
  clear: document.getElementById('clearBtn'),
  charCount: document.getElementById('charCount'),
  reportCard: document.getElementById('reportCard'),
  reportBody: document.getElementById('reportBody'),
  statsGrid: document.getElementById('statsGrid'),
  chartWrap: document.getElementById('chartWrap'),
  reportTimestamp: document.getElementById('reportTimestamp'),
  print: document.getElementById('printBtn'),
  trash: document.getElementById('trashBtn'),
  saveStatus: document.getElementById('saveStatus'),
};

const STORAGE_KEY = 'relatorio-app:texto';
let chartInstance = null;
let loadedFiles = []; // { name, ok, error, sheets: [{ name, headers, rows }] }

/* ---------- Util ---------- */
const fmt = new Intl.NumberFormat('pt-BR');
const fmt2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Tenta converter um valor de célula em número (aceita "1.234,56", "R$ 10", "5%")
function paraNumero(v) {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined) return NaN;
  let s = String(v).trim();
  if (s === '') return NaN;
  s = s.replace(/[R$\s%]/g, '');
  // formato brasileiro: 1.234,56  -> remove pontos de milhar, vírgula vira ponto
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

/* ===========================================================
   CONHECIMENTO embutido (café, Melitta, mercado, gestão).
   Detecta termos no conteúdo e gera dicas de leitura.
   Base completa em conhecimento.html
   =========================================================== */
const CONHECIMENTO = [
  { re: /\bruptur|falta|sem estoque|out of stock|\bosa\b/i,
    tip: 'Ruptura detectada: produto faltando na gôndola é venda perdida na hora. É um dos KPIs que mais explica queda de sell-out — priorize o reabastecimento.' },
  { re: /\bmeta|atingiment|objetivo|target|realizad/i,
    tip: 'Há menção a metas: comece a análise pelo % de atingimento (volume e faturamento) x meta da divisão.' },
  { re: /\bpositiva|cobertura|carteira|clientes ativos/i,
    tip: 'Positivação/cobertura: acompanhe o % de clientes que compraram x total da carteira — baixa positivação derruba o volume mesmo com bom mix.' },
  { re: /\bconilon|robusta|canephora/i,
    tip: 'Conilon/robusta: forte no Espírito Santo (~69% do conilon do país). Mais cafeína e corpo; safra 2025 em alta (+37%).' },
  { re: /\barábica|arabica|gourmet|especial/i,
    tip: 'Arábica/gourmet: base do café fino (forte em Minas). Com a alta de preço, atenção à migração do consumidor de gourmet → tradicional.' },
  { re: /\bpreço|preco|pmc|encarec|aument/i,
    tip: 'Preço: o torrado e moído subiu ~37% ao consumidor (2024). Veja se o preço praticado x PMC está empurrando o shopper para marcas mais baratas.' },
  { re: /\bgôndola|gondola|exposiç|share|prateleira|ponto de venda|\bpdv\b|sortiment/i,
    tip: 'Execução no PDV: share de gôndola, exposição e sortimento são o campo de batalha. A Melitta pode explorar venda casada (café + filtro + cafeteira).' },
  { re: /\brio de janeiro|\brj\b/i,
    tip: 'Rio de Janeiro: praça de consumo e varejo competitivo (berço histórico do café). Foco em disputa de gôndola, preço e exposição.' },
  { re: /\bminas|\bmg\b/i,
    tip: 'Minas Gerais: maior produtor do país (arábica) e cultura cafeeira forte — região com consumo e identidade de café elevados.' },
  { re: /\bespírito santo|espirito santo|\bes\b/i,
    tip: 'Espírito Santo: potência do conilon e cultura de café muito presente, na produção e no consumo.' },
];

function gerarInsights(texto) {
  return CONHECIMENTO.filter((k) => k.re.test(texto)).map((k) => k.tip);
}

/* ===========================================================
   LEITURA DE ARQUIVOS EXCEL / CSV
   =========================================================== */
async function lerArquivo(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheets = wb.SheetNames.map((nome) => {
    const matriz = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, blankrows: false, defval: '' });
    // primeira linha não vazia = cabeçalho
    let h = 0;
    while (h < matriz.length && matriz[h].every((c) => c === '' || c === null)) h++;
    const headers = (matriz[h] || []).map((c, i) => (String(c).trim() || `Coluna ${i + 1}`));
    const rows = [];
    for (let r = h + 1; r < matriz.length; r++) {
      const linha = matriz[r];
      if (!linha || linha.every((c) => c === '' || c === null)) continue;
      const obj = {};
      headers.forEach((nomeCol, i) => { obj[nomeCol] = linha[i] !== undefined ? linha[i] : ''; });
      rows.push(obj);
    }
    return { name: nome, headers, rows };
  });
  return sheets;
}

async function adicionarArquivos(fileListLike) {
  const arquivos = Array.from(fileListLike).filter((f) =>
    /\.(xlsx|xls|csv)$/i.test(f.name));
  for (const file of arquivos) {
    const registro = { name: file.name, ok: false, error: null, sheets: [] };
    try {
      registro.sheets = await lerArquivo(file);
      registro.ok = true;
    } catch (e) {
      registro.error = (e && e.message) ? e.message : 'não foi possível ler o arquivo';
    }
    loadedFiles.push(registro);
  }
  renderFileList();
}

function removerArquivo(idx) {
  loadedFiles.splice(idx, 1);
  renderFileList();
}

function renderFileList() {
  if (!loadedFiles.length) { els.fileList.innerHTML = ''; return; }
  els.fileList.innerHTML = loadedFiles.map((f, i) => {
    const totalLinhas = f.sheets.reduce((a, s) => a + s.rows.length, 0);
    const meta = f.ok
      ? `<span class="file-meta file-status-ok">✓ ${f.sheets.length} planilha(s) · ${fmt.format(totalLinhas)} linhas</span>`
      : `<span class="file-meta file-status-err">✕ erro: ${escapeHtml(f.error)}</span>`;
    return `<li>
      <span aria-hidden="true">📄</span>
      <span class="file-name">${escapeHtml(f.name)}</span>
      ${meta}
      <button class="file-remove" type="button" data-idx="${i}" aria-label="Remover">✕</button>
    </li>`;
  }).join('');
  els.fileList.querySelectorAll('.file-remove').forEach((b) =>
    b.addEventListener('click', () => removerArquivo(parseInt(b.dataset.idx, 10))));
}

/* ---------- Persistência (apenas do texto alternativo) ---------- */
function salvarTexto() {
  try {
    localStorage.setItem(STORAGE_KEY, els.input.value);
    els.saveStatus.textContent = 'Texto salvo';
    clearTimeout(salvarTexto._t);
    salvarTexto._t = setTimeout(() => (els.saveStatus.textContent = ''), 1500);
  } catch (_) {}
}
function carregarTexto() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) { els.input.value = v; }
  } catch (_) {}
}

/* ===========================================================
   RELATÓRIO A PARTIR DAS PLANILHAS
   =========================================================== */
function consolidar() {
  // junta todas as linhas de todas as planilhas de todos os arquivos
  const todas = [];
  const headersSet = [];
  let nSheets = 0;
  loadedFiles.filter((f) => f.ok).forEach((f) => {
    f.sheets.forEach((s) => {
      nSheets++;
      s.headers.forEach((h) => { if (!headersSet.includes(h)) headersSet.push(h); });
      s.rows.forEach((row) => todas.push(row));
    });
  });
  return { rows: todas, headers: headersSet, nFiles: loadedFiles.filter((f) => f.ok).length, nSheets };
}

function analisarColunas(rows, headers) {
  const colunas = headers.map((h) => {
    let numericos = 0, preenchidos = 0;
    let soma = 0, min = Infinity, max = -Infinity;
    const distintos = new Set();
    rows.forEach((r) => {
      const v = r[h];
      if (v === '' || v === null || v === undefined) return;
      preenchidos++;
      distintos.add(String(v));
      const n = paraNumero(v);
      if (!isNaN(n)) { numericos++; soma += n; if (n < min) min = n; if (n > max) max = n; }
    });
    const ehNumerica = preenchidos > 0 && numericos / preenchidos >= 0.6;
    return {
      nome: h, preenchidos, ehNumerica,
      soma, media: numericos ? soma / numericos : 0,
      min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max,
      distintos: distintos.size,
    };
  });
  return colunas;
}

function agregarPorCategoria(rows, colCategoria, colValor) {
  const mapa = new Map();
  rows.forEach((r) => {
    const cat = String(r[colCategoria] ?? '—').trim() || '—';
    const val = paraNumero(r[colValor]);
    if (isNaN(val)) return;
    mapa.set(cat, (mapa.get(cat) || 0) + val);
  });
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}

function relatorioDeTabela() {
  const { rows, headers, nFiles, nSheets } = consolidar();
  const colunas = analisarColunas(rows, headers);
  const numericas = colunas.filter((c) => c.ehNumerica);
  const categoricas = colunas.filter((c) => !c.ehNumerica && c.distintos > 1 && c.distintos <= Math.max(50, rows.length));

  /* --- Cartões --- */
  const stats = [
    { label: 'Arquivos', value: fmt.format(nFiles) },
    { label: 'Planilhas', value: fmt.format(nSheets), accent: 'green' },
    { label: 'Linhas de dados', value: fmt.format(rows.length) },
    { label: 'Colunas', value: fmt.format(headers.length), accent: 'red' },
  ];
  // soma das 2 primeiras colunas numéricas vira cartão de destaque
  numericas.slice(0, 2).forEach((c, i) => {
    stats.push({ label: 'Soma · ' + c.nome, value: fmt2.format(c.soma), accent: i === 0 ? 'green' : 'red' });
  });

  /* --- Gráfico: soma da 1ª coluna numérica por 1ª coluna categórica --- */
  let chartData = null;
  if (numericas.length && categoricas.length) {
    const cat = categoricas[0].nome;
    const val = numericas[0].nome;
    const agg = agregarPorCategoria(rows, cat, val).slice(0, 10);
    chartData = {
      labels: agg.map((a) => a[0]),
      values: agg.map((a) => a[1]),
      titulo: `${val} por ${cat} (top 10)`,
    };
  } else if (numericas.length) {
    chartData = {
      labels: numericas.slice(0, 8).map((c) => c.nome),
      values: numericas.slice(0, 8).map((c) => c.soma),
      titulo: 'Soma por coluna numérica',
    };
  }

  /* --- Insights (varre cabeçalhos + amostra de células) --- */
  const amostra = headers.join(' ') + ' ' +
    rows.slice(0, 200).map((r) => Object.values(r).join(' ')).join(' ');
  const insights = gerarInsights(amostra);
  const insightsHtml = insights.length ? `
    <h3>Insights (base de conhecimento)</h3>
    <ul>${insights.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '';

  /* --- Resumo por coluna numérica --- */
  const resumoNum = numericas.length ? `
    <h3>Resumo das colunas numéricas</h3>
    <table>
      <thead><tr><th>Coluna</th><th>Soma</th><th>Média</th><th>Mínimo</th><th>Máximo</th></tr></thead>
      <tbody>${numericas.map((c) => `<tr>
        <td>${escapeHtml(c.nome)}</td>
        <td>${fmt2.format(c.soma)}</td>
        <td>${fmt2.format(c.media)}</td>
        <td>${fmt2.format(c.min)}</td>
        <td>${fmt2.format(c.max)}</td>
      </tr>`).join('')}</tbody>
    </table>` : '<p>Nenhuma coluna numérica identificada.</p>';

  /* --- Prévia dos dados (15 primeiras linhas) --- */
  const previaHeaders = headers.slice(0, 8);
  const previaRows = rows.slice(0, 15);
  const previa = rows.length ? `
    <h3>Prévia dos dados (${fmt.format(Math.min(15, rows.length))} de ${fmt.format(rows.length)} linhas)</h3>
    <div style="overflow-x:auto">
    <table>
      <thead><tr>${previaHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>${previaRows.map((r) => `<tr>${previaHeaders.map((h) =>
        `<td>${escapeHtml(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    </div>
    ${headers.length > 8 ? `<p class="hint">+ ${headers.length - 8} coluna(s) não exibida(s) na prévia (entram nos cálculos).</p>` : ''}
  ` : '';

  /* --- Arquivos processados --- */
  const arquivos = `
    <h3>Arquivos processados</h3>
    <ul>${loadedFiles.map((f) => f.ok
      ? `<li>${escapeHtml(f.name)} — ${f.sheets.length} planilha(s)</li>`
      : `<li>${escapeHtml(f.name)} — <span style="color:var(--melitta-red)">erro</span></li>`).join('')}</ul>`;

  return {
    stats,
    chartData,
    bodyHtml: insightsHtml + resumoNum + previa + arquivos,
  };
}

/* ===========================================================
   RELATÓRIO A PARTIR DE TEXTO (alternativa)
   =========================================================== */
function relatorioDeTexto(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
  const palavras = (texto.trim().match(/\S+/g) || []);
  const numeros = (texto.match(/-?\d+(?:[.,]\d+)?/g) || []).map(paraNumero).filter((n) => !isNaN(n));
  const soma = numeros.reduce((a, b) => a + b, 0);
  const media = numeros.length ? soma / numeros.length : 0;

  const stats = [
    { label: 'Linhas', value: fmt.format(linhas.length) },
    { label: 'Palavras', value: fmt.format(palavras.length), accent: 'green' },
    { label: 'Números', value: fmt.format(numeros.length), accent: 'red' },
    { label: 'Soma', value: fmt2.format(soma) },
    { label: 'Média', value: fmt2.format(media), accent: 'green' },
  ];

  const insights = gerarInsights(texto);
  const insightsHtml = insights.length ? `
    <h3>Insights (base de conhecimento)</h3>
    <ul>${insights.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : '';

  const linhasHtml = linhas.map((l, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(l)}</td></tr>`).join('');
  const bodyHtml = insightsHtml + `
    <h3>Conteúdo organizado</h3>
    <table><thead><tr><th>#</th><th>Linha</th></tr></thead>
    <tbody>${linhasHtml || '<tr><td colspan="2">Sem conteúdo</td></tr>'}</tbody></table>`;

  return { stats, chartData: { labels: ['Linhas', 'Palavras', 'Números'], values: [linhas.length, palavras.length, numeros.length], titulo: 'Resumo do texto' }, bodyHtml };
}

/* ---------- Renderização ---------- */
function renderStats(stats) {
  els.statsGrid.innerHTML = stats.map((s) => `
    <div class="stat ${s.accent ? 'accent-' + s.accent : ''}">
      <div class="stat-label">${escapeHtml(s.label)}</div>
      <div class="stat-value">${escapeHtml(String(s.value))}</div>
    </div>`).join('');
}

function renderChart(data) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  if (!data) { els.chartWrap.style.display = 'none'; return; }
  els.chartWrap.style.display = '';
  const ctx = document.getElementById('reportChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: data.titulo || 'Valores',
        data: data.values,
        backgroundColor: '#d6011b',
        hoverBackgroundColor: '#00723f',
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: !!data.titulo, text: data.titulo, color: '#1c1d1b', font: { size: 13 } },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function gerar() {
  const temArquivos = loadedFiles.some((f) => f.ok);
  const texto = els.input.value.trim();

  if (!temArquivos && !texto) {
    els.dropzone.classList.add('dragover');
    setTimeout(() => els.dropzone.classList.remove('dragover'), 600);
    return;
  }

  const { stats, chartData, bodyHtml } = temArquivos ? relatorioDeTabela() : relatorioDeTexto(texto);

  renderStats(stats);
  renderChart(chartData);
  els.reportBody.innerHTML = bodyHtml;

  const agora = new Date();
  els.reportTimestamp.textContent = 'Gerado em ' + agora.toLocaleDateString('pt-BR') +
    ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  els.reportCard.hidden = false;
  els.reportCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Eventos: upload ---------- */
els.dropzone.addEventListener('click', () => els.fileInput.click());
els.dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
});
els.fileInput.addEventListener('change', (e) => { adicionarArquivos(e.target.files); e.target.value = ''; });

['dragenter', 'dragover'].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.remove('dragover'); }));
els.dropzone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) adicionarArquivos(e.dataTransfer.files);
});

/* ---------- Eventos: texto e botões ---------- */
els.input.addEventListener('input', salvarTexto);
els.generate.addEventListener('click', gerar);
els.clear.addEventListener('click', () => {
  loadedFiles = [];
  renderFileList();
  els.input.value = '';
  salvarTexto();
  els.reportCard.hidden = true;
});
els.print.addEventListener('click', () => window.print());

// 🗑️ Lixeira — apaga o relatório, os arquivos e o texto (com confirmação)
els.trash.addEventListener('click', () => {
  const ok = window.confirm('Apagar o relatório, os arquivos carregados e o texto? Esta ação não pode ser desfeita.');
  if (!ok) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  loadedFiles = [];
  renderFileList();
  els.reportBody.innerHTML = '';
  els.statsGrid.innerHTML = '';
  els.reportCard.hidden = true;
  els.input.value = '';
  salvarTexto();
});

// Ctrl/Cmd + Enter gera o relatório
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); gerar(); }
});

/* ---------- Início ---------- */
carregarTexto();
