import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { encrypt, decrypt } from "./crypto.js";

const VAULT_DIR = path.join(os.homedir(), ".localvault");
const VAULT_FILE = path.join(VAULT_DIR, "vault.enc");
const META_FILE = path.join(VAULT_DIR, "meta.json");

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
}

export interface VaultMeta {
  version: number;
  created: string;
  lastModified: string;
  entriesCount: number;
  masterHash: string;
}

export type VaultData = VaultEntry[];

export function vaultExists(): boolean { return fs.existsSync(VAULT_FILE); }

export function getMeta(): VaultMeta | null {
  if (!fs.existsSync(META_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(META_FILE, "utf-8")); } catch { return null; }
}

function ensureDir() { if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 }); }

export function saveVault(data: VaultData, password: string, masterHash: string): void {
  ensureDir();
  const plaintext = JSON.stringify(data);
  const encrypted = encrypt(plaintext, password);
  fs.writeFileSync(VAULT_FILE, encrypted, { encoding: "utf-8", mode: 0o600 });
  const meta: VaultMeta = { version: 1, created: getMeta()?.created ?? new Date().toISOString(), lastModified: new Date().toISOString(), entriesCount: data.length, masterHash };
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function loadVault(password: string): VaultData {
  if (!fs.existsSync(VAULT_FILE)) return [];
  const ciphertext = fs.readFileSync(VAULT_FILE, "utf-8");
  const plaintext = decrypt(ciphertext, password);
  return JSON.parse(plaintext) as VaultData;
}

export function exportCSV(data: VaultData): string {
  const headers = ["title","username","password","url","notes","tags","category","createdAt"];
  const rows = data.map(e => [e.title, e.username, e.password, e.url, e.notes, e.tags.join("|"), e.category, e.createdAt].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function searchEntries(data: VaultData, query: string): VaultData {
  const q = query.toLowerCase();
  return data.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.username.toLowerCase().includes(q) ||
    e.url.toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q)) ||
    e.category.toLowerCase().includes(q)
  );
}

export function getAllTags(data: VaultData): string[] {
  const tags = new Set<string>();
  for (const e of data) for (const t of e.tags) tags.add(t);
  return [...tags].sort();
}

export function getAllCategories(data: VaultData): string[] {
  return [...new Set(data.map(e => e.category).filter(Boolean))].sort();
}

export function getAllTags(data: VaultData): string[] {
  const tags = new Set<string>();
  for (const e of data) for (const t of e.tags) tags.add(t);
  return [...tags].sort();
}

export function getAllCategories(data: VaultData): string[] {
  return [...new Set(data.map(e => e.category).filter(Boolean))].sort();
}
