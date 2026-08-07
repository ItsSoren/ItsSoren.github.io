@echo off
setlocal
cd /d "%~dp0"
start "CESTUS SERVER" /min python -m http.server 8765 --bind 127.0.0.1 --directory "%~dp0"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
endlocal
