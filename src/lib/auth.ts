import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export const SESSION_DURATION_DEFAULT = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_DURATION_EXTENDED = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)

function getDb(): Database.Database {
  const dbPath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "skills.db");
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return username === ADMIN_USERNAME && compareSync(password, passwordHash);
  }
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSession(rememberMe = false): string {
  const token = crypto.randomUUID();
  const duration = rememberMe ? SESSION_DURATION_EXTENDED : SESSION_DURATION_DEFAULT;
  const expiresAt = Date.now() + duration;
  const db = getDb();
  try {
    db.prepare("INSERT INTO sessions (token, expires_at) VALUES (?, ?)").run(
      token,
      expiresAt
    );
  } finally {
    db.close();
  }
  return token;
}

export function validateSession(token: string): boolean {
  if (!token) return false;
  const db = getDb();
  try {
    const row = db
      .prepare("SELECT expires_at FROM sessions WHERE token = ?")
      .get(token) as { expires_at: number } | undefined;
    if (!row) return false;
    if (Date.now() > row.expires_at) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      return false;
    }
    return true;
  } finally {
    db.close();
  }
}

export function destroySession(token: string): void {
  if (!token) return;
  const db = getDb();
  try {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  } finally {
    db.close();
  }
}

export function getSessionFromRequest(req: NextRequest): string | null {
  return req.cookies.get("session")?.value || null;
}

export function requireAuth(req: NextRequest): NextResponse | null {
  const token = getSessionFromRequest(req);
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
