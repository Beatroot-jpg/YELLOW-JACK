@echo off
echo ========================================
echo Yellow Jack - GitHub Push Script
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Step 1: Checking git status...
git status
echo.

REM Prompt for GitHub username
set /p GITHUB_USER="Enter your GitHub username: "
echo.

echo Step 2: Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/yellow-jack.git
echo.

echo Step 3: Renaming branch to main...
git branch -M main
echo.

echo Step 4: Pushing to GitHub...
echo (You'll be prompted for your GitHub credentials)
echo NOTE: Use a Personal Access Token as password, not your GitHub password!
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo PUSH FAILED!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Repository doesn't exist on GitHub yet
    echo    - Go to https://github.com/new
    echo    - Create repository named: yellow-jack
    echo    - Don't initialize with README
    echo    - Then run this script again
    echo.
    echo 2. Authentication failed
    echo    - You need a Personal Access Token
    echo    - Go to: https://github.com/settings/tokens
    echo    - Generate new token (classic)
    echo    - Use token as password when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Code pushed to GitHub!
echo ========================================
echo.
echo Your repository: https://github.com/%GITHUB_USER%/yellow-jack
echo.
echo Next steps:
echo 1. Verify code on GitHub
echo 2. Deploy to Railway (see RAILWAY_DEPLOYMENT.md)
echo.
pause

