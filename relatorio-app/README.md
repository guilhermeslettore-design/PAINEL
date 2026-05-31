# Gerador de Relatório

Projeto **independente** (separado do PAINEL). Você envia arquivo(s) **Excel** (ou CSV)
exportados do Varejo 360 e o site gera um relatório automaticamente.

## Como usar
Abra o `index.html` no navegador (ou acesse o link publicado). Não precisa instalar nada.
Arraste os arquivos Excel para a área de upload e clique em **Gerar relatório**.

## O que já vem pronto
- **Upload de Excel/CSV** — um ou vários arquivos, lidos no próprio navegador (SheetJS). Os arquivos não são enviados a servidor nenhum.
- Alternativa: colar um **texto** manualmente.
- Botão **Gerar relatório** (ou `Ctrl/Cmd + Enter`)
- **Cartões** com totais (arquivos, planilhas, linhas, colunas, somas)
- **Resumo das colunas numéricas** (soma, média, mín, máx)
- **Gráfico** automático (soma por categoria) com Chart.js
- **Prévia dos dados** (primeiras linhas)
- **Insights** baseados na Base de Conhecimento (café, Melitta, mercado, gestão)
- **Imprimir / salvar em PDF** e botão **🗑️ Lixeira** para apagar
- **Base de Conhecimento** (`conhecimento.html`): café, Melitta, mercado RJ/MG/ES, gerente divisional
- Visual minimalista profissional, cores Melitta (vermelho + verde)

## Personalização do relatório
Hoje o relatório é genérico-inteligente: detecta colunas numéricas/categóricas
sozinho. Quando o formato exato do Varejo 360 for conhecido (nomes das colunas),
dá para refinar os cálculos na função `relatorioDeTabela()` em `script.js`.

## Arquivos
- `index.html` — estrutura da página
- `conhecimento.html` — Base de Conhecimento
- `styles.css` — estilo (cores Melitta)
- `script.js` — leitura de Excel e lógica do relatório
