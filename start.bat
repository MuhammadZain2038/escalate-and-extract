@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===============================================
echo   Escalate ^& Extract - Starting
echo ===============================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker is not installed on this machine.
    echo Opening the Docker Desktop download page...
    start https://www.docker.com/products/docker-desktop/
    echo.
    echo Install Docker Desktop, restart your computer if prompted,
    echo then run this script again.
    pause
    exit /b 1
)

echo Checking if Docker Desktop is running...
docker info >nul 2>nul
if errorlevel 1 (
    echo Docker Desktop is not running. Attempting to start it...

    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo Could not find Docker Desktop automatically.
        echo Please start Docker Desktop manually, then run this script again.
        pause
        exit /b 1
    )

    echo Waiting for Docker to become ready, this can take a minute...
    set /a count=0
    :waitloop
    timeout /t 3 >nul
    docker info >nul 2>nul
    if errorlevel 1 (
        set /a count+=1
        if !count! GEQ 30 (
            echo Docker did not start in time. Please start it manually and try again.
            pause
            exit /b 1
        )
        goto waitloop
    )
)

echo Docker is ready.
echo.
echo Building and launching all containers...
echo This can take a few minutes on the first run.
echo.

docker compose up -d --build

if errorlevel 1 (
    echo.
    echo Something went wrong bringing the containers up.
    echo Check the output above for details.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   Environment is live.
echo   Opening http://localhost:8000
echo ===============================================

timeout /t 2 >nul
start http://localhost:8000

pause