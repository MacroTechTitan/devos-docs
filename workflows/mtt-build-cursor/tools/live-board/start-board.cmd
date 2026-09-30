@echo off
rem DevOS live board: start the server (if it is not already running) and open the browser.
setlocal
set "NODE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"
set "PORT=7777"
if not "%LIVE_BOARD_PORT%"=="" set "PORT=%LIVE_BOARD_PORT%"

netstat -ano -p TCP | findstr /R /C:"127.0.0.1:%PORT% .*LISTENING" >nul
if errorlevel 1 (
  start "DevOS live board" /min "%NODE%" "%~dp0server.js"
  rem give the server a moment to bind before the browser asks for the page
  ping -n 2 127.0.0.1 >nul
) else (
  echo Live board already running on port %PORT%.
)

start "" "http://127.0.0.1:%PORT%/"
endlocal
