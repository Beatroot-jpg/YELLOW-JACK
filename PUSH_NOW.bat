@echo off
echo ========================================
echo Pushing Yellow Jack to GitHub
echo Repository: https://github.com/Beatroot-jpg/YELLOW-JACK
echo ========================================
echo.

cd /d "%~dp0"

echo Removing any existing remote...
git remote remove origin 2>nul

echo Adding your GitHub repository...
git remote add origin https://github.com/Beatroot-jpg/YELLOW-JACK.git

echo Renaming branch to main...
git branch -M main

echo Pushing to GitHub...
echo (You may be prompted for credentials - use your Personal Access Token as password)
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo PUSH FAILED - Need Personal Access Token
    echo ========================================
    echo.
    echo Get your token:
    echo 1. Go to: https://github.com/settings/tokens
    echo 2. Click "Generate new token (classic)"
    echo 3. Name: "Yellow Jack"
    echo 4. Check: "repo" (all boxes)
    echo 5. Generate and COPY the token
    echo 6. Run this script again
    echo 7. Use token as password when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Code is on GitHub!
echo ========================================
echo.
echo View your code: https://github.com/Beatroot-jpg/YELLOW-JACK
echo.
echo Next: Deploy to Railway (see backend/RAILWAY_DEPLOYMENT.md)
echo.
pause

