@echo off
cd /d "%~dp0"

echo ===============================================
echo   Escalate ^& Extract - Uninstall
echo ===============================================
echo.
echo This will:
echo   - Stop and remove all project containers
echo   - Remove the networks Docker created for this project
echo   - Remove the Docker images built for this project
echo     (localstack's own image will NOT be removed)
echo.
echo Your project files (code, Terraform, images) are NOT touched.
echo This only cleans up Docker. You can run start.bat again anytime
echo to rebuild everything from scratch.
echo.

set /p confirm="Type YES to continue, or anything else to cancel: "
if /i not "%confirm%"=="YES" (
    echo Cancelled. Nothing was changed.
    pause
    exit /b 0
)

echo.
echo Stopping and removing containers, networks, and project images...
docker compose down --rmi local --remove-orphans

echo.
echo ===============================================
echo   Cleanup complete.
echo ===============================================
echo.
echo To use the project again later, just run start.bat.

pause