@echo off
cd /d A:\Claude\Painel

echo Inicializando git...
git init

echo Adicionando arquivos...
git add .

echo Fazendo commit...
git commit -m "deploy inicial com API Claude"

echo Configurando repositorio remoto...
git remote remove origin 2>nul
git remote add origin https://github.com/guilhermeslettore-design/PAINEL.git

echo Enviando para GitHub...
git branch -M main
git push -u origin main

echo.
echo === CONCLUIDO! Codigo enviado para o GitHub ===
pause
