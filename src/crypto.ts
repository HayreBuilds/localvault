import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32;
const SALT_LEN = 32;
const IV_LEN = 16;
const TAG_LEN = 16;
const PBKDF2_ITER = 100000;
const PBKDF2_DIGEST = "sha256";

export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITER, KEY_LEN, PBKDF2_DIGEST);
}

export function encrypt(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = (cipher as unknown as { getAuthTag(): Buffer }).getAuthTag();
  const payload = Buffer.concat([salt, iv, tag, encrypted]);
  return payload.toString("base64");
}

export function decrypt(ciphertext: string, password: string): string {
  const payload = Buffer.from(ciphertext, "base64");
  const salt = payload.subarray(0, SALT_LEN);
  const iv = payload.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = payload.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const encrypted = payload.subarray(SALT_LEN + IV_LEN + TAG_LEN);
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  (decipher as unknown as { setAuthTag(tag: Buffer): void }).setAuthTag(tag);
  return decipher.update(encrypted).toString("utf-8") + decipher.final("utf-8");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const attempt = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
  } catch { return false; }
}

export function generatePassword(
  length = 32,
  opts = { upper: true, lower: true, digits: true, symbols: true }
): string {
  let chars = "";
  if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.digits) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

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
