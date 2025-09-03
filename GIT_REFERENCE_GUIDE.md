# Git Reference Guide for ShopStation App

*Your complete reference for Git version control*

---

## 📚 Git Glossary

### Core Concepts

**Repository (Repo)** - A folder/project that Git tracks. Contains all your files plus a hidden `.git` folder with the history.

**Commit** - A snapshot of your code at a specific point in time. Think of it as a save point in a video game.

**Branch** - A parallel version of your code. Like having multiple copies of your project to work on different features.

**Main/Master Branch** - The primary branch of your code. This is your "production-ready" version.

**Working Directory** - Your current folder with all your files as you see them now.

**Staging Area (Index)** - A temporary area where you prepare files before committing them. Like a shopping cart before checkout.

**Remote** - A version of your repository stored elsewhere (like GitHub). Your "cloud backup."

**Origin** - The default name for your main remote repository (usually on GitHub).

**Clone** - Making a copy of a repository from GitHub to your computer.

**Fork** - Creating your own copy of someone else's repository on GitHub.

**Pull Request (PR)** - Proposing changes to be merged into another branch or repository.

**Merge** - Combining changes from one branch into another.

**HEAD** - A pointer to your current commit/branch. Where you are "right now."

**Hash/SHA** - A unique ID for each commit (like `1d25afe`). Git's way of identifying commits.

---

## 🔧 Essential Git Commands

### Repository Setup
```bash
# Initialize a new Git repository
git init

# Clone a repository from GitHub
git clone <repository-url>

# Check if you're in a Git repository
git status
```

### Daily Workflow Commands

#### Checking Status
```bash
# See what files have changed
git status

# See detailed changes in files
git diff

# See changes that are staged
git diff --staged
```

#### Staging Changes
```bash
# Stage a specific file
git add filename.js

# Stage all changed files
git add .

# Stage all files of a certain type
git add *.js

# Remove a file from staging
git restore --staged filename.js
```

#### Committing Changes
```bash
# Commit staged changes with a message
git commit -m "Your descriptive message"

# Commit and add all changed files in one command
git commit -am "Your message"

# Amend the last commit (fix message or add forgotten files)
git commit --amend -m "New message"
```

#### Viewing History
```bash
# See commit history
git log

# See compact one-line history
git log --oneline

# See last 5 commits
git log --oneline -5

# See what changed in a specific commit
git show <commit-hash>
```

### Working with Remotes
```bash
# Add a remote repository
git remote add origin <github-url>

# See all remotes
git remote -v

# Push changes to GitHub
git push origin main

# Pull changes from GitHub
git pull origin main

# Push and set upstream (first time)
git push -u origin main
```

### Branch Management
```bash
# See all branches
git branch

# Create a new branch
git branch feature-name

# Switch to a branch
git checkout branch-name

# Create and switch to new branch in one command
git checkout -b feature-name

# Merge a branch into current branch
git merge branch-name

# Delete a branch
git branch -d branch-name
```

### Undoing Things
```bash
# Unstage a file
git restore --staged filename.js

# Discard changes in working directory
git restore filename.js

# Go back to a previous commit (temporary)
git checkout <commit-hash>

# Reset to a previous commit (careful!)
git reset --hard <commit-hash>

# Revert a commit (safe way to undo)
git revert <commit-hash>
```

---

## 🎯 Best Practices

### Commit Messages
**Good Examples:**
- `Add user authentication system`
- `Fix price calculation bug in shopping cart`
- `Update admin panel with delete functionality`
- `Refactor database connection for better performance`

**Bad Examples:**
- `fix stuff`
- `changes`
- `asdfasdf`
- `final version`

### Commit Message Format
```
Type: Brief description (50 chars max)

More detailed explanation if needed (wrap at 72 chars).
- Can include bullet points
- Explain what and why, not how
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

### When to Commit
✅ **DO commit when:**
- You've completed a logical unit of work
- A feature is working
- You've fixed a bug
- Before switching tasks
- At the end of each work session

❌ **DON'T commit when:**
- Code doesn't compile/run
- Tests are failing
- Work is half-finished
- Just changing formatting

---

## 📁 .gitignore Best Practices

### What to Ignore
```bash
# Dependencies
node_modules/
*/node_modules/

# Environment files (contain secrets)
.env
.env.local
.env.production

# Database files (unless needed)
*.db
*.sqlite

# Build outputs
build/
dist/
*.min.js

# Log files
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp

# Backup files
*.backup
*.bak
*.tmp
```

---

## 🔄 Common Workflows

### Daily Development Workflow
1. `git status` - Check what's changed
2. `git add .` - Stage your changes
3. `git commit -m "Descriptive message"` - Save your changes
4. `git push origin main` - Send to GitHub

### Feature Development Workflow
1. `git checkout -b feature-name` - Create feature branch
2. *Work on your feature*
3. `git add .` && `git commit -m "Feature message"`
4. `git checkout main` - Switch back to main
5. `git merge feature-name` - Merge your feature
6. `git branch -d feature-name` - Delete feature branch
7. `git push origin main` - Push to GitHub

### Fixing Mistakes
```bash
# Oops, forgot to add a file to last commit
git add forgotten-file.js
git commit --amend --no-edit

# Oops, wrong commit message
git commit --amend -m "Correct message"

# Oops, committed to wrong branch
git log --oneline -1  # Get commit hash
git reset --hard HEAD~1  # Remove commit from current branch
git checkout correct-branch
git cherry-pick <commit-hash>  # Add commit to correct branch
```

---

## 🚨 Troubleshooting

### Common Error Messages

**"Please commit your changes or stash them before you switch branches"**
- You have uncommitted changes
- Solution: `git add .` && `git commit -m "WIP"` or `git stash`

**"Your branch is ahead of 'origin/main' by X commits"**
- You have local commits not pushed to GitHub
- Solution: `git push origin main`

**"Your branch is behind 'origin/main' by X commits"**
- GitHub has newer commits than your local copy
- Solution: `git pull origin main`

**"Merge conflict"**
- Git can't automatically merge changes
- Solution: Open conflicted files, resolve conflicts manually, then commit

### Emergency Commands
```bash
# I want to throw away ALL changes and start fresh
git reset --hard HEAD

# I want to go back to how GitHub looks
git fetch origin
git reset --hard origin/main

# I committed something terrible and want to undo it
git revert HEAD

# Show me exactly what will be pushed
git log origin/main..HEAD --oneline
```

---

## 📊 Understanding Git Status

### Status Messages Explained
```bash
# Clean working directory
"nothing to commit, working tree clean"
→ All changes are committed, you're up to date

# Files changed but not staged
"Changes not staged for commit"
→ You've modified files but haven't run `git add` yet

# Files staged for commit
"Changes to be committed"
→ Files are ready to be committed with `git commit`

# New files Git doesn't know about
"Untracked files"
→ New files that need `git add` to be tracked
```

---

## 🌟 Pro Tips

1. **Commit Early, Commit Often** - Small, frequent commits are better than large ones
2. **Use Branches** - Keep main branch stable, develop features in separate branches  
3. **Write Good Messages** - Your future self will thank you
4. **Review Before Committing** - Use `git diff` to see what you're committing
5. **Pull Before Push** - Always `git pull` before `git push` to avoid conflicts
6. **Backup is Key** - Push to GitHub regularly, don't just commit locally

---

## 🔗 Useful Resources

- **GitHub Desktop** - GUI alternative to command line
- **VS Code Git Integration** - Built-in Git support in your editor
- **Git Documentation** - https://git-scm.com/docs
- **Interactive Git Tutorial** - https://learngitbranching.js.org/

---

*This reference guide will grow with your project. Keep it updated as you learn new Git concepts!*

---

**Next Steps:** Connect to GitHub and set up automated deployments 🚀