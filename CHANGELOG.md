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
