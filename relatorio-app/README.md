# Gerador de Relatório

Projeto **independente** (separado do PAINEL). Um site onde você cola um texto
em um campo e recebe um relatório abaixo.

## Como usar
Abra o arquivo `index.html` no navegador (duplo clique). Não precisa instalar nada.

## O que já vem pronto
- Campo de texto grande para colar as informações
- Botão **Gerar relatório** (ou `Ctrl/Cmd + Enter`)
- **Cartões de totais e cálculos**
- **Gráfico** (Chart.js)
- **Imprimir / salvar em PDF**
- **Salvamento automático no navegador** (não perde o texto ao fechar)
- Visual minimalista profissional, cores Melitta (vermelho + verde)

## Personalização do relatório
A lógica do relatório fica na função `montarRelatorio()` em `script.js`.
Hoje ela traz um exemplo (linhas, palavras, números, soma, média).
Assim que o formato desejado for definido, basta ajustar essa função —
o resto da estrutura (salvar, imprimir, gráfico, cartões) já está pronto.

## Arquivos
- `index.html` — estrutura da página
- `styles.css` — estilo (cores Melitta)
- `script.js` — lógica do relatório
