/* ===========================================================
   Gerador de Relatório — lógica
   OBS: a função montarRelatorio() abaixo é um exemplo/base.
   Quando você me explicar o formato exato do relatório,
   é só essa função que vamos ajustar — o resto já fica pronto:
   salvar no navegador, imprimir/PDF, gráfico e cartões.
   =========================================================== */

const els = {
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

/* ---------- Util ---------- */
const fmt = new Intl.NumberFormat('pt-BR');

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------- Persistência no navegador ---------- */
function salvarTexto() {
  try {
    localStorage.setItem(STORAGE_KEY, els.input.value);
    els.saveStatus.textContent = 'Salvo automaticamente';
    clearTimeout(salvarTexto._t);
    salvarTexto._t = setTimeout(() => (els.saveStatus.textContent = ''), 1500);
  } catch (_) { /* localStorage indisponível */ }
}

function carregarTexto() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) { els.input.value = v; atualizarContagem(); }
  } catch (_) {}
}

/* ---------- Contagem de caracteres ---------- */
function atualizarContagem() {
  const n = els.input.value.length;
  els.charCount.textContent = `${fmt.format(n)} ${n === 1 ? 'caractere' : 'caracteres'}`;
}

/* ===========================================================
   CONHECIMENTO embutido (café, Melitta, mercado, gestão).
   Detecta termos no texto colado e gera dicas de leitura.
   Consulte a Base de Conhecimento completa em conhecimento.html
   =========================================================== */
const CONHECIMENTO = [
  { re: /\bruptur|falta|sem estoque|out of stock|osa\b/i,
    tip: 'Ruptura detectada: produto faltando na gôndola é venda perdida na hora. É um dos KPIs que mais explica queda de sell-out — priorize o reabastecimento.' },
  { re: /\bmeta|atingiment|objetivo|target/i,
    tip: 'Há menção a metas: comece a análise pelo % de atingimento (volume e faturamento) x meta da divisão.' },
  { re: /\bpositiva|cobertura|carteira|clientes ativos/i,
    tip: 'Positivação/cobertura: acompanhe o % de clientes que compraram x total da carteira — baixa positivação derruba o volume mesmo com bom mix.' },
  { re: /\bconilon|robusta|canephora/i,
    tip: 'Conilon/robusta: forte no Espírito Santo (~69% do conilon do país). Mais cafeína e corpo; safra 2025 em alta (+37%).' },
  { re: /\barábica|arabica|gourmet|especial/i,
    tip: 'Arábica/gourmet: base do café fino (forte em Minas). Com a alta de preço, fique atento à migração do consumidor de gourmet → tradicional.' },
  { re: /\bpreço|preco|pmc|encarec|aument/i,
    tip: 'Preço: o torrado e moído subiu ~37% ao consumidor (2024). Monitore se o preço praticado x PMC está empurrando o shopper para marcas mais baratas.' },
  { re: /\bgôndola|gondola|exposiç|share|prateleira|ponto de venda|pdv/i,
    tip: 'Execução no PDV: share de gôndola, exposição e sortimento são o campo de batalha. A Melitta pode explorar venda casada (café + filtro + cafeteira).' },
  { re: /\brio de janeiro|\brj\b/i,
    tip: 'Rio de Janeiro: praça de consumo e varejo competitivo (berço histórico do café). Foco em disputa de gôndola, preço e exposição.' },
  { re: /\bminas|\bmg\b/i,
    tip: 'Minas Gerais: maior produtor do país (arábica) e cultura cafeeira forte — região com consumo e identidade de café elevados.' },
  { re: /\bespírito santo|espirito santo|\bes\b/i,
    tip: 'Espírito Santo: potência do conilon e cultura de café muito presente, tanto na produção quanto no consumo.' },
];

function gerarInsights(texto) {
  return CONHECIMENTO.filter((k) => k.re.test(texto)).map((k) => k.tip);
}

/* ===========================================================
   GERAÇÃO DO RELATÓRIO  (base de exemplo — vamos personalizar)
   =========================================================== */
function montarRelatorio(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
  const palavras = (texto.trim().match(/\S+/g) || []);
  const numeros = (texto.match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map((s) => parseFloat(s.replace(/\./g, '').replace(',', '.')))
    .filter((n) => !isNaN(n));

  const soma = numeros.reduce((a, b) => a + b, 0);
  const media = numeros.length ? soma / numeros.length : 0;

  /* --- Cartões de totais/cálculos --- */
  const stats = [
    { label: 'Linhas', value: fmt.format(linhas.length) },
    { label: 'Palavras', value: fmt.format(palavras.length), accent: 'green' },
    { label: 'Caracteres', value: fmt.format(texto.length) },
    { label: 'Números encontrados', value: fmt.format(numeros.length), accent: 'red' },
    { label: 'Soma dos números', value: fmt.format(Math.round(soma * 100) / 100) },
    { label: 'Média', value: fmt.format(Math.round(media * 100) / 100) },
  ];

  /* --- Corpo do relatório --- */
  const linhasHtml = linhas
    .map((l, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(l)}</td></tr>`)
    .join('');

  /* --- Insights baseados no conhecimento embutido --- */
  const insights = gerarInsights(texto);
  const insightsHtml = insights.length ? `
    <h3>Insights (base de conhecimento)</h3>
    <ul>${insights.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
  ` : '';

  const bodyHtml = `
    ${insightsHtml}
    <h3>Conteúdo organizado</h3>
    <table>
      <thead><tr><th>#</th><th>Linha</th></tr></thead>
      <tbody>${linhasHtml || '<tr><td colspan="2">Sem conteúdo</td></tr>'}</tbody>
    </table>
  `;

  /* --- Dados do gráfico (exemplo: distribuição) --- */
  const chartData = {
    labels: ['Linhas', 'Palavras', 'Números'],
    values: [linhas.length, palavras.length, numeros.length],
  };

  return { stats, bodyHtml, chartData };
}

/* ---------- Renderização ---------- */
function renderStats(stats) {
  els.statsGrid.innerHTML = stats.map((s) => `
    <div class="stat ${s.accent ? 'accent-' + s.accent : ''}">
      <div class="stat-label">${escapeHtml(s.label)}</div>
      <div class="stat-value">${escapeHtml(String(s.value))}</div>
    </div>
  `).join('');
}

function renderChart(data) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById('reportChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Quantidade',
        data: data.values,
        backgroundColor: ['#d6011b', '#00723f', '#a80016'],
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function gerar() {
  const texto = els.input.value.trim();
  if (!texto) {
    els.input.focus();
    return;
  }
  const { stats, bodyHtml, chartData } = montarRelatorio(texto);

  renderStats(stats);
  renderChart(chartData);
  els.reportBody.innerHTML = bodyHtml;

  const agora = new Date();
  els.reportTimestamp.textContent = 'Gerado em ' +
    agora.toLocaleDateString('pt-BR') + ' às ' +
    agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  els.reportCard.hidden = false;
  els.reportCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Eventos ---------- */
els.input.addEventListener('input', () => { atualizarContagem(); salvarTexto(); });
els.generate.addEventListener('click', gerar);
els.clear.addEventListener('click', () => {
  els.input.value = '';
  atualizarContagem();
  salvarTexto();
  els.reportCard.hidden = true;
  els.input.focus();
});
els.print.addEventListener('click', () => window.print());

// 🗑️ Lixeira — apaga o relatório e o texto salvo (com confirmação)
els.trash.addEventListener('click', () => {
  const ok = window.confirm('Apagar o relatório e limpar o texto? Esta ação não pode ser desfeita.');
  if (!ok) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  els.reportBody.innerHTML = '';
  els.statsGrid.innerHTML = '';
  els.reportCard.hidden = true;
  els.input.value = '';
  atualizarContagem();
  salvarTexto();
  els.input.focus();
});

// Ctrl/Cmd + Enter gera o relatório
els.input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); gerar(); }
});

/* ---------- Início ---------- */
carregarTexto();
atualizarContagem();
