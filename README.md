# localvault

> Self-hosted password manager. AES-256 encryption, runs on localhost, zero cloud, zero subscription, zero account. Your data stays on your machine.

```
$ npx localvault

  ◆ localvault — running at http://127.0.0.1:8765
  Your vault is at ~/.localvault/vault.enc
  Open your browser to get started.
```

Then set a master password and start storing passwords. Everything is encrypted on your machine with AES-256-GCM + PBKDF2.

---

## Install

```bash
# Run immediately (no install)
npx localvault

# Install globally
npm install -g localvault
localvault
```

Open http://127.0.0.1:8765 in your browser.

## Features

- 🔐 **AES-256-GCM encryption** — industry-standard authenticated encryption
- 🔑 **PBKDF2 key derivation** — 100,000 iterations, per-vault random salt
- 🚫 **Zero cloud** — all data stays in `~/.localvault/vault.enc`
- 🔒 **Session-based auth** — vault auto-locks after 30 minutes of inactivity
- 🔍 **Search** — instant search across titles, usernames, URLs, tags
- 📂 **Categories** — organize passwords into custom categories
- ⭐ **Favorites** — star important entries
- 🔑 **Password generator** — cryptographically random, configurable length and character sets
- 📥 **CSV export** — backup your data anytime
- ✏️ **Full CRUD** — add, edit, delete entries with a clean UI

## Security Design

```
Master Password
     ↓
PBKDF2 (SHA-256, 100,000 iterations, 32-byte random salt)
     ↓
AES-256-GCM Key
     ↓
Encrypted vault (salt + IV + auth tag + ciphertext)
     ↓
~/.localvault/vault.enc
```

- The master password **never leaves your machine**
- The vault file contains everything needed to decrypt (salt, IV, auth tag) but is useless without the password
- Sessions expire after 30 minutes; the server holds the in-memory key during that window
- All data is served only on `127.0.0.1` — not accessible from the network
- No telemetry, no analytics, no external connections

## API

localvault exposes a local REST API (for scripts, CLI access, etc.):

```bash
# Check vault status
curl http://127.0.0.1:8765/api/status

# Unlock vault
curl -X POST http://127.0.0.1:8765/api/unlock \
  -H "Content-Type: application/json" \
  -d '{"password": "your-master-password"}'

# Search entries
curl -H "Authorization: Bearer <token>" \
  "http://127.0.0.1:8765/api/entries?q=github"

# Generate a password
curl "http://127.0.0.1:8765/api/generate-password?length=32"

# Export to CSV
curl -H "Authorization: Bearer <token>" \
  "http://127.0.0.1:8765/api/export/csv" > backup.csv
```

## Data Location

Your encrypted vault is stored at:
- **macOS / Linux:** `~/.localvault/vault.enc`
- **Windows:** `%USERPROFILE%\.localvault\vault.enc`

Back this file up regularly. Without the master password, it cannot be decrypted.

## Why Not Just Use...

- **LastPass** — Cloud-based, has been breached multiple times
- **1Password** — $36/year subscription, cloud-dependent
- **Bitwarden** — Excellent, but requires an account and server
- **KeePass** — Great but desktop-only with complex sync story
- **localvault** — Zero trust, zero account, zero subscription, zero cloud

## License

MIT
