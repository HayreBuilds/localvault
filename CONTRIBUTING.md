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
