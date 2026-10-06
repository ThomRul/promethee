@echo off
setlocal
if exist "%~dp0runtime\node.exe" (
  "%~dp0runtime\node.exe" "%~dp0dist\src\main.js" %*
) else (
  echo Runtime prive absent. Reextraire la distribution Promethee. Pour les sources, utiliser npm start.
  exit /b 1
)
exit /b %errorlevel%
