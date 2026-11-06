@echo off
echo GOST 19.701-90 — Docker build (Senior 33y)
echo -------------------------------------------------
docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker ne nayden. Ustanovi Docker Desktop: https://docs.docker.com/get-docker/
  pause
  exit /b 1
)
echo Sobirau obraz gost-19.701:1.0 ...
docker build -t gost-19.701:1.0 .
if errorlevel 1 (
  echo Oshibka sborki
  pause
  exit /b 1
)
echo Zapuskau konteiner na http://localhost:3000 ...
docker rm -f gost-19.701 2>nul
docker run -d --name gost-19.701 -p 3000:80 --restart unless-stopped gost-19.701:1.0
echo.
echo GOTOVO! Otkroy http://localhost:3000
echo Health: http://localhost:3000/health
pause
