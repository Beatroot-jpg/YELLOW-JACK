# GitHub Repository Setup Guide

This guide will help you create a GitHub repository for Yellow Jack and push your code.

---

## 🎯 Option 1: Create Repository via GitHub Website (Easiest)

### Step 1: Create Repository on GitHub

1. Go to https://github.com
2. Click the **"+"** icon in top right → **"New repository"**
3. Fill in details:
   - **Repository name:** `yellow-jack` (or `yellow-jack-tracker`)
   - **Description:** "Bar tracker system with sales, roster, and commission management"
   - **Visibility:** Choose **Private** or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### Step 2: Push Your Code

GitHub will show you commands. Use these in PowerShell:

```powershell
# Navigate to YELLOW JACK directory
cd "C:\Users\User\Desktop\CODING\IRRELEVANT DEVELOPMENT\TRACKER SYSTEM\YELLOW JACK"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Yellow Jack bar tracker system"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/yellow-jack.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Done!** Your code is now on GitHub.

---

## 🎯 Option 2: Using GitHub CLI (Advanced)

If you have GitHub CLI installed:

```powershell
cd "C:\Users\User\Desktop\CODING\IRRELEVANT DEVELOPMENT\TRACKER SYSTEM\YELLOW JACK"

# Create repository and push in one command
gh repo create yellow-jack --private --source=. --remote=origin --push
```

---

## 🎯 Option 3: Using GitHub Desktop (Visual)

1. Download **GitHub Desktop** from https://desktop.github.com
2. Install and sign in with your GitHub account
3. Click **"Add"** → **"Add Existing Repository"**
4. Browse to: `C:\Users\User\Desktop\CODING\IRRELEVANT DEVELOPMENT\TRACKER SYSTEM\YELLOW JACK`
5. Click **"Create Repository"**
6. Click **"Publish repository"**
7. Choose private/public and click **"Publish"**

---

## ✅ Verify Your Repository

After pushing, verify on GitHub:

1. Go to https://github.com/YOUR-USERNAME/yellow-jack
2. You should see:
   - ✅ `README.md` displayed on homepage
   - ✅ `backend/` folder
   - ✅ HTML files (analytics.html, sales.html, etc.)
   - ✅ `config.js`
   - ✅ Documentation files
   - ❌ **NO** `node_modules/` folder (excluded by .gitignore)
   - ❌ **NO** `.env` file (excluded by .gitignore)

---

## 🚨 Important: Check .gitignore

Make sure these files are **NOT** in your repository:
- ❌ `backend/node_modules/` - Too large, not needed
- ❌ `backend/.env` - Contains secrets, security risk
- ❌ `backend/package-lock.json` - Can cause conflicts

If you see these files on GitHub:
```powershell
# Remove them from git (but keep locally)
git rm -r --cached backend/node_modules
git rm --cached backend/.env
git commit -m "Remove ignored files"
git push
```

---

## 📝 What to Do If You Get Errors

### Error: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/yellow-jack.git
```

### Error: "failed to push some refs"
```powershell
# Pull first, then push
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: "Authentication failed"
You need to use a **Personal Access Token** instead of password:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Give it a name: "Yellow Jack Deployment"
4. Select scopes: **repo** (all checkboxes)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. When pushing, use the token as your password

Or use **GitHub CLI** or **GitHub Desktop** to avoid this.

---

## 🔄 Daily Workflow (After Initial Setup)

### Making Changes:

```powershell
# Navigate to project
cd "C:\Users\User\Desktop\CODING\IRRELEVANT DEVELOPMENT\TRACKER SYSTEM\YELLOW JACK"

# Check what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Add login page and authentication"

# Push to GitHub
git push
```

### Railway Auto-Deploy:
Once connected to Railway, every `git push` will automatically deploy your backend! 🚀

---

## 🎯 Next Steps After GitHub Setup

1. ✅ Code is on GitHub
2. ➡️ **Deploy to Railway** (follow `backend/RAILWAY_DEPLOYMENT.md`)
3. ➡️ **Connect frontend** (follow `FRONTEND_SETUP.md`)
4. ➡️ **Deploy frontend** to Netlify

---

## 📚 Useful Git Commands

```powershell
# See what changed
git status

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Pull latest changes
git pull
```

---

## 🆘 Need Help?

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com
- **GitHub Desktop:** https://desktop.github.com

---

## ✅ Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Repository is private (if needed)
- [ ] `.gitignore` working (no node_modules or .env)
- [ ] README.md displays correctly
- [ ] Ready to connect to Railway

**Once done, proceed to `backend/RAILWAY_DEPLOYMENT.md`!**

