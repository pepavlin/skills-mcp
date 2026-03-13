import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

// Simple session token stored in memory (suitable for single-user)
let sessionToken: string | null = null;
let sessionExpiry: number = 0;

export function validateCredentials(
  username: string,
  password: string
): boolean {
  // If ADMIN_PASSWORD_HASH is set, use bcrypt comparison
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return username === ADMIN_USERNAME && compareSync(password, passwordHash);
  }
  // Otherwise, plain comparison (dev mode)
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSession(): string {
  const token = crypto.randomUUID();
  sessionToken = token;
  sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
}

export function validateSession(token: string): boolean {
  if (!sessionToken || !token) return false;
  if (Date.now() > sessionExpiry) {
    sessionToken = null;
    return false;
  }
  return token === sessionToken;
}

export function destroySession(): void {
  sessionToken = null;
  sessionExpiry = 0;
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
