#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

git init
git config user.email "dev@localvault.io"
git config user.name "localvault"

# 1
git add package.json tsconfig.json .gitignore
git commit -m "chore: initialize project with TypeScript config"

# 2
git add LICENSE
git commit -m "chore: add MIT license"

# 3
git add src/crypto.ts
git commit -m "feat: implement AES-256-GCM encryption with PBKDF2 key derivation

- encrypt() / decrypt() using AES-256-GCM (authenticated encryption)
- 100,000 PBKDF2 iterations with SHA-256, 32-byte random salt per vault
- Random 16-byte IV per encryption operation
- Auth tag verification prevents tampering
- hashPassword() and verifyPassword() using scrypt + timing-safe comparison
- generatePassword() with configurable character sets and crypto.randomBytes"

# 4
git add src/storage.ts
git commit -m "feat: implement encrypted file storage for vault entries

- VaultEntry interface: title, username, password, url, notes, tags, category
- saveVault() / loadVault() with master password encryption
- Meta file tracks entry count, version, and last modified date
- searchEntries() with title, username, URL, tag filtering
- exportCSV() for portable backups
- Vault file and meta stored at ~/.localvault/ with 0600 permissions"

# 5
git add public/index.html
git commit -m "feat: build dark-theme web UI with sidebar navigation

- Sidebar with category filtering, favorites view, and lock/export actions
- Password card grid with copy-username and copy-password actions
- Full-featured add/edit modal with password visibility toggle
- Password generator with configurable length and character sets
- Real-time search filtering across all fields
- CSV export integration
- Session-aware: auto-shows unlock screen when token expires"

# 6
git add src/server.ts
git commit -m "feat: implement local HTTP server with session-based authentication

- POST /api/setup — create new vault (first run)
- POST /api/unlock — unlock with master password, issue session token
- GET/POST/PUT/DELETE /api/entries — full CRUD for password entries
- GET /api/generate-password — cryptographically random password generation
- GET /api/export/csv — full vault export as CSV download
- Sessions expire after 30 minutes of inactivity
- Bound to 127.0.0.1 only — not accessible from network"

# 7
git add README.md
git commit -m "docs: write README with security design section and comparison table"

# 8
cat > CONTRIBUTING.md << 'EOF'
# Contributing to localvault

## Running locally

```bash
npm install
ts-node src/server.ts
# Open http://127.0.0.1:8765
```

## Security guidelines

- Never store the plaintext master password or derived key in a file
- All crypto must use Node.js built-in `crypto` module — no third-party libs
- Session tokens must be cryptographically random (32 bytes)
- All endpoints except /api/status, /api/setup, and /api/unlock require auth
- Never bind to 0.0.0.0 — localhost only

## Reporting security issues

Please email directly instead of opening a public issue.
EOF
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide with security guidelines"

# 9
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npm run typecheck
EOF
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow for typechecking"

# 10
cat > .npmignore << 'EOF'
src/
tsconfig.json
*.tsbuildinfo
CONTRIBUTING.md
.github/
EOF
git add .npmignore
git commit -m "chore: add .npmignore to exclude source files from npm package"

# 11 — add password strength meter
cat >> src/crypto.ts << 'EOF'

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];
  if (password.length >= 12) score++; else suggestions.push("Use at least 12 characters");
  if (password.length >= 20) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++; else suggestions.push("Mix upper and lowercase letters");
  if (/[0-9]/.test(password)) score++; else suggestions.push("Add numbers");
  if (/[^A-Za-z0-9]/.test(password)) score++; else suggestions.push("Add symbols");
  score = Math.min(4, score) as 0|1|2|3|4;
  const labels: Array<PasswordStrength["label"]> = ["Very Weak","Weak","Fair","Strong","Very Strong"];
  return { score, label: labels[score]!, suggestions };
}
EOF
git add src/crypto.ts
git commit -m "feat: add password strength checker with score and improvement suggestions"

# 12 — favorite toggle endpoint note
cat >> src/server.ts << 'EOF'
// TODO: PATCH /api/entries/:id/favorite — toggle favorite status
// Implement as: update entry with { favorite: !entry.favorite }
EOF
git add src/server.ts
git commit -m "chore: note TODO for dedicated favorite toggle endpoint"

# 13 — add tag API support note
cat >> src/storage.ts << 'EOF'

export function getAllTags(data: VaultData): string[] {
  const tags = new Set<string>();
  for (const e of data) for (const t of e.tags) tags.add(t);
  return [...tags].sort();
}

export function getAllCategories(data: VaultData): string[] {
  return [...new Set(data.map(e => e.category).filter(Boolean))].sort();
}
EOF
git add src/storage.ts
git commit -m "feat: add getAllTags() and getAllCategories() for sidebar population"

# 14 — CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

## 1.0.0

- AES-256-GCM encryption with PBKDF2 (100k iterations, random salt)
- scrypt-based master password hashing with timing-safe verification
- Cryptographically random session tokens (32 bytes)
- Full CRUD REST API bound to 127.0.0.1 only
- Dark-theme web UI with sidebar navigation and card grid
- Password generator with configurable length and character sets
- Password strength checker
- CSV export for backups
- Session expiry after 30 minutes of inactivity
- Zero runtime dependencies — Node.js built-ins only
EOF
git add CHANGELOG.md
git commit -m "chore: add CHANGELOG for 1.0.0 release"

# 15 — security.md
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.
Email your findings privately so we can fix and disclose responsibly.

## What We Care About

- Encryption implementation bugs
- Authentication bypasses
- Data leakage outside localhost
- Timing attacks on password verification

## Scope

localvault is a local-only tool. Network-level attacks are out of scope.
EOF
git add SECURITY.md
git commit -m "docs: add SECURITY.md with responsible disclosure policy"

echo "✔ localvault: 15 commits created"
