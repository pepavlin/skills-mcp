import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Hoist the mock function so it can be referenced inside vi.mock factory
const mockChatCreate = vi.fn();

vi.mock("openai", () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockChatCreate,
      },
    };
  }
  return { default: MockOpenAI };
});

// Mock auth — allow authentication by default
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(() => null),
}));

// Import after mocks are set up
import { POST } from "../route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/chat", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "sk-test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 503 when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = makeRequest({ messages: [{ role: "user", content: "hello" }] });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("OPENAI_API_KEY");
  });

  it("returns 400 when messages array is missing", async () => {
    const req = makeRequest({ currentSkill: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("messages array is required");
  });

  it("returns 400 when messages array is empty", async () => {
    const req = makeRequest({ messages: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("messages array is required");
  });

  it("returns 400 when a message has invalid role", async () => {
    const req = makeRequest({
      messages: [{ role: "system", content: "hello" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid message format");
  });

  it("returns 401 when not authenticated", async () => {
    const { requireAuth } = await import("@/lib/auth");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireAuth).mockReturnValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const req = makeRequest({ messages: [{ role: "user", content: "hello" }] });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns AI message when no tool call is made", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Tell me more about what the skill should do.",
            tool_calls: null,
          },
        },
      ],
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "I want a skill for writing code" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Tell me more about what the skill should do.");
    expect(body.fieldUpdates).toBeUndefined();
  });

  it("returns field updates when AI calls update_skill_fields", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "I've filled in the skill fields for you!",
            tool_calls: [
              {
                type: "function",
                function: {
                  name: "update_skill_fields",
                  arguments: JSON.stringify({
                    name: "Code Review Assistant",
                    description: "Helps review code for quality and correctness",
                    type: "prompt",
                    suggestedTags: ["code", "review"],
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "A skill for reviewing code" }],
      availableTags: ["code", "review", "testing"],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("I've filled in the skill fields for you!");
    expect(body.fieldUpdates).toBeDefined();
    expect(body.fieldUpdates.name).toBe("Code Review Assistant");
    expect(body.fieldUpdates.description).toBe("Helps review code for quality and correctness");
    expect(body.fieldUpdates.type).toBe("prompt");
    expect(body.fieldUpdates.suggestedTags).toEqual(["code", "review"]);
  });

  it("generates a fallback message when AI only returns a tool call without text", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "",
            tool_calls: [
              {
                type: "function",
                function: {
                  name: "update_skill_fields",
                  arguments: JSON.stringify({
                    name: "Test Skill",
                    type: "snippet",
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "Make a test skill" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBeTruthy();
    expect(body.fieldUpdates.name).toBe("Test Skill");
  });

  it("returns 502 on OpenAI API error", async () => {
    mockChatCreate.mockRejectedValueOnce({ status: 500, message: "Internal server error" });

    const req = makeRequest({ messages: [{ role: "user", content: "hello" }] });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("failed");
  });

  it("returns 502 on invalid API key error", async () => {
    mockChatCreate.mockRejectedValueOnce({ status: 401, message: "Unauthorized" });

    const req = makeRequest({ messages: [{ role: "user", content: "hello" }] });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("Invalid OpenAI API key");
  });

  it("returns 429 on rate limit error", async () => {
    mockChatCreate.mockRejectedValueOnce({ status: 429, message: "Rate limit" });

    const req = makeRequest({ messages: [{ role: "user", content: "hello" }] });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("rate limit");
  });

  it("passes current skill context and available tags to OpenAI", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "I see you already have a name set.",
            tool_calls: null,
          },
        },
      ],
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "expand the content please" }],
      currentSkill: { name: "My Skill", type: "prompt" },
      availableTags: ["frontend", "backend"],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockChatCreate).toHaveBeenCalledOnce();
    const callArgs = mockChatCreate.mock.calls[0][0];
    const systemMsg = callArgs.messages[0].content as string;
    expect(systemMsg).toContain("My Skill");
    expect(systemMsg).toContain("frontend");
  });

  it("handles conversation history correctly", async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Sure, I can help with that.",
            tool_calls: null,
          },
        },
      ],
    });

    const req = makeRequest({
      messages: [
        { role: "user", content: "First message" },
        { role: "assistant", content: "First reply" },
        { role: "user", content: "Second message" },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const callArgs = mockChatCreate.mock.calls[0][0];
    // 1 system + 3 conversation messages
    expect(callArgs.messages).toHaveLength(4);
    expect(callArgs.messages[1].role).toBe("user");
    expect(callArgs.messages[2].role).toBe("assistant");
    expect(callArgs.messages[3].role).toBe("user");
  });
});
