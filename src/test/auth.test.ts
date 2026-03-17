import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCredentials,
  createSession,
  validateSession,
  destroySession,
  SESSION_DURATION_DEFAULT,
  SESSION_DURATION_EXTENDED,
} from "@/lib/auth";

// Reset module-level DB connection between tests so each test starts fresh
// The setup.ts already wipes the DB file before the test run

describe("validateCredentials", () => {
  it("accepts correct default credentials", () => {
    expect(validateCredentials("admin", "admin")).toBe(true);
  });

  it("rejects wrong password", () => {
    expect(validateCredentials("admin", "wrong")).toBe(false);
  });

  it("rejects wrong username", () => {
    expect(validateCredentials("hacker", "admin")).toBe(false);
  });

  it("rejects empty credentials", () => {
    expect(validateCredentials("", "")).toBe(false);
  });
});

describe("createSession / validateSession", () => {
  it("creates a valid session token", () => {
    const token = createSession();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("validates a freshly created session", () => {
    const token = createSession();
    expect(validateSession(token)).toBe(true);
  });

  it("rejects an unknown token", () => {
    expect(validateSession("nonexistent-token")).toBe(false);
  });

  it("rejects empty token", () => {
    expect(validateSession("")).toBe(false);
  });

  it("creates multiple independent sessions", () => {
    const t1 = createSession();
    const t2 = createSession();
    expect(t1).not.toBe(t2);
    expect(validateSession(t1)).toBe(true);
    expect(validateSession(t2)).toBe(true);
  });
});

describe("destroySession", () => {
  it("invalidates a session after destroy", () => {
    const token = createSession();
    expect(validateSession(token)).toBe(true);
    destroySession(token);
    expect(validateSession(token)).toBe(false);
  });

  it("does not throw when destroying non-existent token", () => {
    expect(() => destroySession("ghost-token")).not.toThrow();
  });

  it("does not affect other sessions", () => {
    const t1 = createSession();
    const t2 = createSession();
    destroySession(t1);
    expect(validateSession(t1)).toBe(false);
    expect(validateSession(t2)).toBe(true);
  });
});

describe("session duration", () => {
  it("default session lasts 7 days", () => {
    expect(SESSION_DURATION_DEFAULT).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("extended session (remember me) lasts 30 days", () => {
    expect(SESSION_DURATION_EXTENDED).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("validates session created with rememberMe=true", () => {
    const token = createSession(true);
    expect(validateSession(token)).toBe(true);
  });

  it("rejects an expired session", () => {
    // We can't mock time easily without vi.useFakeTimers, so test it indirectly
    // by verifying expired tokens in DB are rejected
    const token = createSession();
    // Manually expire via DB to simulate time passing
    const Database = require("better-sqlite3");
    const path = require("path");
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "skills.db");
    const db = new Database(dbPath);
    db.prepare("UPDATE sessions SET expires_at = 1 WHERE token = ?").run(token);
    db.close();

    expect(validateSession(token)).toBe(false);
  });
});
