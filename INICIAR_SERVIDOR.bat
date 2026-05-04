@echo off
title Servidor GSI — Painel Monitoramento
color 0A
echo.
echo  ============================================
echo   PAINEL GSI — SERVIDOR LOCAL
echo  ============================================
echo.
echo  Chat com Claude AI disponivel no site!
echo  Botao 🤖 no canto inferior direito de cada pagina.
echo.
echo  ─────────────────────────────────────────
echo   CONFIGURACAO DA API KEY DA ANTHROPIC
echo  ─────────────────────────────────────────
echo.

:: Verificar se API key esta no config.json
findstr /i "SUA_API_KEY_AQUI" "%~dp0config.json" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo  [AVISO] API Key ainda nao configurada!
  echo.
  echo  Para ativar o chat com Claude:
  echo    1. Abra o arquivo config.json nesta pasta
  echo    2. Substitua  SUA_API_KEY_AQUI  pela sua chave
  echo    3. Obtenha sua key em: https://console.anthropic.com/settings/keys
  echo    4. Salve o arquivo e reinicie este servidor
  echo.
) else (
  echo  [OK] API Key configurada — chat pronto para uso!
  echo.
)

cd /d %~dp0

:: Encontrar node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo  [ERRO] node.js nao encontrado no PATH.
  echo  Tentando caminho padrao...
  set NODEEXE="%ProgramFiles%\nodejs\node.exe"
) else (
  set NODEEXE=node
)

echo  Iniciando servidor em http://localhost:8081
echo.
timeout /t 1 /nobreak >nul
start "" "http://localhost:8081"
%NODEEXE% server.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo  [ERRO] Servidor encerrou com erro. Verifique acima.
)
pause
