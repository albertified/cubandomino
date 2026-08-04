@echo off
echo ==================================================
echo   Starting Git Setup and Deployment
echo ==================================================
echo.

:: Prompt for custom commit message
set "COMMIT_MSG=Update website files"
set /p "USER_MSG=Enter commit message (Press Enter for default: "%COMMIT_MSG%"): "

:: Use custom message if entered
if not "%USER_MSG%"=="" set "COMMIT_MSG=%USER_MSG%"

echo.
echo Using commit message: "%COMMIT_MSG%"
echo.

:: 1. Initialize repository
echo [1/7] Initializing Git repository...
git init
if errorlevel 1 goto error

:: 2. Set default branch to main
echo [2/7] Setting default branch to main...
git branch -M main
if errorlevel 1 goto error

:: 3. Add remote (or update URL if remote already exists)
echo [3/7] Configuring remote repository...
git remote add origin https://github.com/albertified/cubandomino.git 2>nul
if errorlevel 1 (
    echo Remote 'origin' already exists. Updating URL instead...
    git remote set-url origin https://github.com/albertified/cubandomino.git
)

:: 4. Fetch latest from origin
echo [4/7] Fetching from remote origin...
git fetch origin
if errorlevel 1 goto error

:: 5. Soft reset to origin/main
echo [5/7] Performing soft reset to origin/main...
git reset --soft origin/main
if errorlevel 1 goto error

:: 6. Stage and commit files
echo [6/7] Staging and committing files...
git add .
if errorlevel 1 goto error

git commit -m "%COMMIT_MSG%"

:: 7. Push changes upstream
echo [7/7] Pushing to GitHub...
git push -u origin main
if errorlevel 1 goto error

echo.
echo ==================================================
echo   SUCCESS: Website files pushed to GitHub!
echo ==================================================
echo.
pause
exit /b 0

:error
echo.
echo ==================================================
echo   ERROR: Script failed at the last command.
echo ==================================================
echo.
pause
exit /b 1