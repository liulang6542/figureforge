@echo off
title FigureForge - 本地服务
cd /d "%~dp0"

set PORT=8123
set PY=%~dp0runtime\python.exe

if not exist "%PY%" (
  echo.
  echo   [X] 找不到 runtime\python.exe
  echo       便携版 Python 丢了。把 runtime 文件夹整个恢复回来即可。
  echo.
  pause
  exit /b 1
)

echo.
echo   FigureForge 本地服务
echo   --------------------------------------------------
echo   工作台 : http://127.0.0.1:%PORT%/forge/
echo   设置页 : http://127.0.0.1:%PORT%/forge/settings.html
echo.
echo   保持本窗口开着。关闭窗口 = 停止服务。
echo   --------------------------------------------------
echo.

rem 等服务起来再打开浏览器，避免打开时页面还没就绪
start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start http://127.0.0.1:%PORT%/forge/"

"%PY%" -m http.server %PORT% --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo   [X] 服务没能启动。
  echo       若提示 address already in use，说明端口 %PORT% 被占用：
  echo       用记事本把本文件里的 set PORT=8123 改成 8124 再试。
  echo.
)

echo.
echo   服务已停止。
pause
