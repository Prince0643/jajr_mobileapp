# Collaboration Guide — Repo 1 (Mobile App)

---

## 1) Forking Workflow (Recommended)

### Step 1: Fork the repo
- Go to https://github.com/Prince0643/jajr_mobileapp
- Click **Fork** → choose your GitHub account
- Clone your fork locally:
  ```bash
  git clone https://github.com/<your-username>/jajr_mobileapp.git
  cd jajr_mobileapp
  ```

### Step 2: Add the original repo as `upstream`
```bash
git remote add upstream https://github.com/Prince0643/jajr_mobileapp.git
```

### Step 3: Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

### Step 4: Work + Commit
```bash
git add -A
git commit -m "feat: add your change"
```

### Step 5: Keep your fork up to date
Before you start new work:
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Step 6: Open a Pull Request
- Push your branch:
  ```bash
  git push origin feature/your-feature-name
  ```
- Go to your fork on GitHub → **Contribute** → **Open pull request**
- Target the original repo’s `main` branch

---

## 2) CI/CD (Optional but Recommended)

### What to automate
- **Lint/format checks**
- **TypeScript checks**
- **Unit tests (if any)**
- **Build the app** (Expo build or native build)

### Example GitHub Actions (`.github/workflows/ci.yml`)
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build  # if you have a build script
```

### Deploy builds (optional)
- Expo EAS builds can be triggered on merge to `main`
- Example:
  ```yaml
  - name: Build preview
    run: npx eas build --platform all --profile preview
    env:
      EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  ```

---

## 3) Branch Naming & Commit Style

### Branch naming
- `feature/short-description`
- `fix/short-description`
- `docs/short-description`

### Commit messages (Conventional Commits)
- `feat: add time logs modal`
- `fix: handle timezone correctly`
- `docs: update collaboration guide`

---

## 4) Code Style & Linting

- Use ESLint + Prettier (already configured)
- Run before committing:
  ```bash
  npm run lint
  npm run format
  ```

---

## 5) Environment Variables

- Never commit `.env` (it’s in `.gitignore`)
- Create `.env.example` with placeholder keys:
  ```env
  EXPO_PUBLIC_API_URL=https://yourdomain.com/attendance_web/
  EXPO_PUBLIC_OTHER_KEY=placeholder
  ```
- Each developer creates their own `.env` locally.

---

## 6) Review Process

- All changes go via **Pull Request**
- At least one review before merge to `main`
- CI must pass
- Use GitHub’s **Reviewers** and **Assignees**

---

## 7) Syncing After Merge

After your PR is merged to `main`:
```bash
git checkout main
git pull upstream main
git push origin main
```

---

## 8) Resolving Conflicts

If `git merge upstream/main` has conflicts:
```bash
git status  # see conflicted files
# Edit files → resolve → mark as resolved
git add .
git commit -m "Merge upstream/main"
git push origin main
```

---

## 9) Optional: Protected Branches

In the original repo settings:
- Protect `main` branch
- Require PR reviews
- Require CI to pass
- Restrict force pushes

---

## 10) Quick Checklist for New Contributors

- [ ] Fork and clone
- [ ] Add `upstream` remote
- [ ] Create feature branch
- [ ] Install deps (`npm ci`)
- [ ] Make changes
- [ ] Run lint/format
- [ ] Commit with conventional style
- [ ] Push branch
- [ ] Open PR
- [ ] Respond to reviews
- [ ] Merge after approval

---

## 11) Prompt to Share

> “I’ve set up the mobile app repo at https://github.com/Prince0643/jajr_mobileapp. Please fork it, create a feature branch for your work, and open a PR when ready. We’re using conventional commits and GitHub Actions for CI. Let me know if you need help setting up your local environment.”
