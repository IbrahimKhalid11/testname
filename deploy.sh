#!/bin/bash

# Report Repository System - Deployment Script
# This script helps you prepare and deploy your application

echo "🚀 Report Repository System - Deployment Setup"
echo "=============================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check for essential files
echo "🔍 Checking essential files..."

ESSENTIAL_FILES=(
    "index.html"
    "assets/js/supabase/config.js"
    "netlify.toml"
    ".gitignore"
    "README.md"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Ask for GitHub repository URL
echo ""
echo "📋 Please provide your GitHub repository URL:"
echo "   Example: https://github.com/username/repository-name"
read -p "GitHub URL: " GITHUB_URL

if [ -z "$GITHUB_URL" ]; then
    echo "❌ GitHub URL is required"
    exit 1
fi

# Add remote origin
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin "$GITHUB_URL"
echo "✅ GitHub remote added"

# Add all files
echo "📦 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Initial deployment setup: Report Repository System"
    echo "✅ Changes committed"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Next steps:"
    echo "1. Go to https://netlify.com"
    echo "2. Click 'New site from Git'"
    echo "3. Choose GitHub and select your repository"
    echo "4. Click 'Deploy site'"
    echo ""
    echo "Your site will be live in a few minutes!"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Failed to push to GitHub"
    echo "Please check your GitHub repository URL and permissions"
    exit 1
fi 