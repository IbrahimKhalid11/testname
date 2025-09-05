@echo off
setlocal enabledelayedexpansion

echo 🚀 Report Repository System - Deployment Setup
echo ==============================================

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

REM Check for essential files
echo 🔍 Checking essential files...

set "ESSENTIAL_FILES=index.html assets/js/supabase/config.js netlify.toml .gitignore README.md"

for %%f in (%ESSENTIAL_FILES%) do (
    if exist "%%f" (
        echo ✅ %%f exists
    ) else (
        echo ❌ %%f is missing
    )
)

REM Ask for GitHub repository URL
echo.
echo 📋 Please provide your GitHub repository URL:
echo    Example: https://github.com/username/repository-name
set /p GITHUB_URL="GitHub URL: "

if "%GITHUB_URL%"=="" (
    echo ❌ GitHub URL is required
    pause
    exit /b 1
)

REM Add remote origin
echo 🔗 Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin "%GITHUB_URL%"
echo ✅ GitHub remote added

REM Add all files
echo 📦 Adding files to Git...
git add .

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo 💾 Committing changes...
    git commit -m "Initial deployment setup: Report Repository System"
    echo ✅ Changes committed
) else (
    echo ℹ️  No changes to commit
)

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    echo Please check your GitHub repository URL and permissions
    pause
    exit /b 1
) else (
    echo ✅ Successfully pushed to GitHub
    echo.
    echo 🎉 Setup Complete!
    echo ==================
    echo.
    echo Next steps:
    echo 1. Go to https://netlify.com
    echo 2. Click 'New site from Git'
    echo 3. Choose GitHub and select your repository
    echo 4. Click 'Deploy site'
    echo.
    echo Your site will be live in a few minutes!
    echo.
    echo 📚 For detailed instructions, see DEPLOYMENT.md
)

pause 