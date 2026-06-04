# 🔐 localvault

[![Build Status](https://img.shields.io/github/actions/workflow/status/HayreBuilds/localvault/ci.yml?branch=main)](https://github.com/HayreBuilds/localvault/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: AES-256](https://img.shields.io/badge/Security-AES--256-blue.svg)](https://github.com/HayreBuilds/localvault)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HayreBuilds/localvault/pulls)

**Self-hosted password manager with zero external dependencies. Encrypted, local-first, and private.**

> Don't trust the cloud with your master password? **localvault** is a minimalist, secure vault that runs entirely on your localhost. No account, no subscription, no trackers.

---

## 🚀 Quick Start

```bash
# Start your local vault
npx localvault
```

1. Open **[http://localhost:3000](http://localhost:3000)**
2. Set your **Master Password** (This is never stored, only used to derive your encryption key).
3. Start saving your secrets securely.

---

## ✨ Key Features

- **🛡️ Military-Grade Encryption**: Uses AES-256-GCM with PBKDF2 key derivation.
- **🏠 100% Offline**: No internet connection required. Your data never leaves your machine.
- **🎨 Minimalist UI**: A clean, dark-themed web interface for managing your passwords.
- **🏷️ Smart Organization**: Tag and categorize your entries for instant searching.
- **📦 Easy Backup**: Export your vault to an encrypted file or plain CSV.
- **⚡ Zero Dependencies**: Built with pure Node.js and vanilla JS. No `node_modules` required to run.

---

## 💻 Installation

```bash
npm install -g localvault
```

---

## 🛠️ Usage

### Store Secrets
Add websites, usernames, and passwords. Generate strong, random passwords with the built-in generator.

### Search & Organize
Use the sidebar to filter by tags (e.g., `Work`, `Finance`, `Social`) or use the instant search bar.

### Security Audit
View a dashboard of your password strength and get alerts for reused or weak passwords.

---

## 🔍 Security Design

1. **Zero-Knowledge**: Your Master Password is never saved to disk.
2. **Key Derivation**: We use 100,000 iterations of PBKDF2 to turn your password into a 256-bit key.
3. **GCM Mode**: Every entry is encrypted with a unique IV (Initialization Vector) for authenticated encryption.
4. **Local Only**: The server only listens on `127.0.0.1`, making it inaccessible from your network.

---

## 🤝 Contributing

Security is a community effort. Please see our [Contributing Guide](CONTRIBUTING.md) and [Security Policy](SECURITY.md).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💖 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HayreBuilds/localvault&type=Date)](https://star-history.com/#HayreBuilds/localvault&Date)
