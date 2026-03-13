import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";

// Mock global fetch for webhook calls
const fetchMock = vi.fn();

describe("Proposals API", () => {
  let sessionToken: string;

  beforeEach(() => {
    sessionToken = createSession();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PROPOSAL_WEBHOOK_URL;
  });

  function makeRequest(body: unknown) {
    const req = new NextRequest("http://localhost:3000/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    req.cookies.set("session", sessionToken);
    return req;
  }

  it("should return 401 without auth", async () => {
    const { POST } = await import("@/app/api/proposals/route");
    const req = new NextRequest("http://localhost:3000/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 when message is missing", async () => {
    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("Message is required");
  });

  it("should return 400 when message is empty string", async () => {
    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({ message: "   " }));
    expect(res.status).toBe(400);
  });

  it("should return 503 when webhook URL is not configured", async () => {
    delete process.env.PROPOSAL_WEBHOOK_URL;
    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({ message: "Add dark mode" }));
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.error).toBe("Webhook URL is not configured");
  });

  it("should forward message to webhook and return success", async () => {
    process.env.PROPOSAL_WEBHOOK_URL = "https://example.com/webhook";
    fetchMock.mockResolvedValueOnce({ ok: true });

    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({ message: "  Add dark mode  " }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Add dark mode" }),
    });
  });

  it("should return 502 when webhook returns non-ok response", async () => {
    process.env.PROPOSAL_WEBHOOK_URL = "https://example.com/webhook";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({ message: "Fix bug" }));
    expect(res.status).toBe(502);
  });

  it("should return 502 when webhook fetch throws", async () => {
    process.env.PROPOSAL_WEBHOOK_URL = "https://example.com/webhook";
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { POST } = await import("@/app/api/proposals/route");
    const res = await POST(makeRequest({ message: "Fix bug" }));
    expect(res.status).toBe(502);
  });
});
