#!/usr/bin/env node
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { vaultExists, getMeta, saveVault, loadVault, exportCSV, generateId, searchEntries } from "./storage.js";
import { hashPassword, verifyPassword, generatePassword } from "./crypto.js";
import type { VaultEntry } from "./storage.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8765;
const HOST = "127.0.0.1";

// Session store
const sessions = new Map<string, { password: string; expires: number }>();

function createSession(password: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { password, expires: Date.now() + 30 * 60 * 1000 });
  setTimeout(() => sessions.delete(token), 30 * 60 * 1000);
  return token;
}

function getSession(token: string): string | null {
  const s = sessions.get(token);
  if (!s || s.expires < Date.now()) { sessions.delete(token); return null; }
  s.expires = Date.now() + 30 * 60 * 1000;
  return s.password;
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((res, rej) => {
    let data = "";
    req.on("data", c => data += c);
    req.on("end", () => { try { res(JSON.parse(data || "{}")); } catch { res({}); } });
    req.on("error", rej);
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function auth(req: http.IncomingMessage): string | null {
  const h = req.headers["authorization"] ?? "";
  const token = h.replace("Bearer ", "");
  return getSession(token);
}

const PUBLIC_DIR = path.join(__dirname, "..", "public");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const p = url.pathname;
  const method = req.method ?? "GET";

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");

  // Serve static files
  if (method === "GET" && !p.startsWith("/api/")) {
    const filePath = p === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, p.slice(1));
    if (fs.existsSync(filePath) && !filePath.includes("..")) {
      const ext = path.extname(filePath);
      const mime: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
      res.writeHead(200, { "Content-Type": mime[ext] ?? "text/plain" });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(PUBLIC_DIR, "index.html")).pipe(res);
    return;
  }

  // API routes
  if (p === "/api/status") { return json(res, 200, { exists: vaultExists(), meta: getMeta() }); }

  if (p === "/api/setup" && method === "POST") {
    const body = await parseBody(req);
    const pw = body["password"] as string;
    if (!pw || pw.length < 8) return json(res, 400, { error: "Password must be at least 8 characters" });
    if (vaultExists()) return json(res, 409, { error: "Vault already exists" });
    const masterHash = hashPassword(pw);
    saveVault([], pw, masterHash);
    const token = createSession(pw);
    return json(res, 201, { token, message: "Vault created" });
  }

  if (p === "/api/unlock" && method === "POST") {
    const body = await parseBody(req);
    const pw = body["password"] as string;
    const meta = getMeta();
    if (!meta) return json(res, 404, { error: "No vault found" });
    if (!verifyPassword(pw, meta.masterHash)) return json(res, 401, { error: "Incorrect password" });
    const token = createSession(pw);
    return json(res, 200, { token });
  }

  if (p === "/api/lock" && method === "POST") {
    const h = req.headers["authorization"] ?? "";
    sessions.delete(h.replace("Bearer ", ""));
    return json(res, 200, { message: "Locked" });
  }

  // Authenticated routes
  const password = auth(req);
  if (!password) return json(res, 401, { error: "Unauthorized — vault is locked" });

  if (p === "/api/entries" && method === "GET") {
    const data = loadVault(password);
    const q = url.searchParams.get("q");
    const tag = url.searchParams.get("tag");
    const cat = url.searchParams.get("category");
    let results = q ? searchEntries(data, q) : data;
    if (tag) results = results.filter(e => e.tags.includes(tag));
    if (cat) results = results.filter(e => e.category === cat);
    return json(res, 200, results);
  }

  if (p === "/api/entries" && method === "POST") {
    const body = await parseBody(req);
    const data = loadVault(password);
    const meta = getMeta()!;
    const now = new Date().toISOString();
    const entry: VaultEntry = {
      id: generateId(),
      title: body["title"] as string ?? "Untitled",
      username: body["username"] as string ?? "",
      password: body["password"] as string ?? "",
      url: body["url"] as string ?? "",
      notes: body["notes"] as string ?? "",
      tags: (body["tags"] as string[] | undefined) ?? [],
      category: body["category"] as string ?? "General",
      createdAt: now, updatedAt: now, favorite: false,
    };
    data.push(entry);
    saveVault(data, password, meta.masterHash);
    return json(res, 201, entry);
  }

  const entryMatch = p.match(/^\/api\/entries\/([^/]+)$/);
  if (entryMatch) {
    const id = entryMatch[1]!;
    const data = loadVault(password);
    const meta = getMeta()!;
    const idx = data.findIndex(e => e.id === id);

    if (method === "GET") {
      if (idx === -1) return json(res, 404, { error: "Entry not found" });
      return json(res, 200, data[idx]);
    }

    if (method === "PUT" || method === "PATCH") {
      if (idx === -1) return json(res, 404, { error: "Entry not found" });
      const body = await parseBody(req);
      data[idx] = { ...data[idx]!, ...body, id, updatedAt: new Date().toISOString() };
      saveVault(data, password, meta.masterHash);
      return json(res, 200, data[idx]);
    }

    if (method === "DELETE") {
      if (idx === -1) return json(res, 404, { error: "Entry not found" });
      data.splice(idx, 1);
      saveVault(data, password, meta.masterHash);
      return json(res, 204, null);
    }
  }

  if (p === "/api/generate-password" && method === "GET") {
    const len = parseInt(url.searchParams.get("length") ?? "32");
    const symbols = url.searchParams.get("symbols") !== "false";
    return json(res, 200, { password: generatePassword(len, { upper: true, lower: true, digits: true, symbols }) });
  }

  if (p === "/api/export/csv" && method === "GET") {
    const data = loadVault(password);
    const csv = exportCSV(data);
    res.writeHead(200, { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=localvault-export.csv" });
    res.end(csv);
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  process.stdout.write(`\n  ◆ localvault — running at ${url}\n`);
  process.stdout.write(`  Your vault is at ~/.localvault/vault.enc\n`);
  process.stdout.write(`  Open your browser to get started.\n\n`);
  // Try to open browser
  const { exec } = require("child_process");
  exec(`open ${url} 2>/dev/null || xdg-open ${url} 2>/dev/null || start ${url} 2>/dev/null`, () => {});
});
// TODO: PATCH /api/entries/:id/favorite — toggle favorite status
// Implement as: update entry with { favorite: !entry.favorite }
