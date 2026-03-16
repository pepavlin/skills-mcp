import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAuth } from "@/lib/auth";
import { parseJsonBody, isErrorResponse } from "@/lib/api-utils";

const SKILL_TYPES = ["prompt", "workflow", "technique", "snippet", "config"] as const;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SkillFieldUpdates {
  name?: string;
  description?: string;
  content?: string;
  type?: (typeof SKILL_TYPES)[number];
  suggestedTags?: string[];
}

export interface AIChatRequest {
  messages: ChatMessage[];
  currentSkill?: {
    name?: string;
    description?: string;
    content?: string;
    type?: string;
  };
  availableTags?: string[];
}

export interface AIChatResponse {
  message: string;
  fieldUpdates?: SkillFieldUpdates;
}

const SYSTEM_PROMPT = `You are an AI assistant helping users create and edit skills for an AI skills management system.
Skills are reusable prompts, workflows, techniques, snippets, or configurations used by AI assistants via the Model Context Protocol (MCP).

Your job is to:
1. Have a friendly conversation to understand what the user wants the skill to do
2. Ask clarifying questions when you need more information
3. Generate high-quality, actionable skill content
4. Fill in the skill fields using the update_skill_fields function whenever you have enough information

Skill types:
- prompt: Direct instructions or system prompts for AI assistants
- workflow: Multi-step processes or procedures with clear sequential steps
- technique: Specific approaches, methodologies, or patterns for AI to follow
- snippet: Short reusable text fragments, templates, or code
- config: Configuration settings, parameters, or structured settings

Guidelines for skill content:
- Keep descriptions concise but informative (20–200 characters) — they are used for MCP discovery
- Make content detailed, specific, and actionable
- Use clear structure (headers, bullet points) for workflows and techniques
- Write in second-person imperative ("Do this...", "Follow these steps...")
- Call update_skill_fields whenever you have enough context to fill in any fields — you can call it multiple times as you gather more information
- Always provide a conversational response alongside any function call`;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant is not configured. Set the OPENAI_API_KEY environment variable." },
      { status: 503 }
    );
  }

  const body = await parseJsonBody(req);
  if (isErrorResponse(body)) return body;

  const { messages, currentSkill, availableTags } = body as unknown as AIChatRequest;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // Validate message structure
  for (const msg of messages) {
    if (!msg.role || !msg.content || !["user", "assistant"].includes(msg.role)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }
  }

  const openai = getOpenAIClient()!;

  // Build context about current skill state
  let contextNote = "";
  if (currentSkill && Object.values(currentSkill).some(Boolean)) {
    const parts: string[] = ["Current skill state:"];
    if (currentSkill.name) parts.push(`- Name: ${currentSkill.name}`);
    if (currentSkill.description) parts.push(`- Description: ${currentSkill.description}`);
    if (currentSkill.type) parts.push(`- Type: ${currentSkill.type}`);
    if (currentSkill.content) parts.push(`- Content (first 200 chars): ${currentSkill.content.slice(0, 200)}${currentSkill.content.length > 200 ? "..." : ""}`);
    contextNote = parts.join("\n");
  }

  if (availableTags && availableTags.length > 0) {
    contextNote += `\n\nAvailable tags to choose from: ${availableTags.join(", ")}`;
  }

  const systemMessage = contextNote
    ? `${SYSTEM_PROMPT}\n\n${contextNote}`
    : SYSTEM_PROMPT;

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "update_skill_fields",
        description:
          "Update the skill form fields with values extracted from the conversation. Call this whenever you have enough context to fill in one or more fields.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "A concise, descriptive skill name (e.g. 'React Component Builder')",
            },
            description: {
              type: "string",
              description:
                "A short description of what the skill does. Must be at least 20 characters. Used for MCP discoverability.",
            },
            content: {
              type: "string",
              description:
                "The full skill body — instructions, prompt template, workflow steps, configuration, etc. Should be detailed and actionable.",
            },
            type: {
              type: "string",
              enum: SKILL_TYPES,
              description: "The skill type that best fits the content",
            },
            suggestedTags: {
              type: "array",
              items: { type: "string" },
              description:
                "Tag names that fit this skill. Use existing tags from the available list when possible.",
            },
          },
          additionalProperties: false,
        },
      },
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      tools,
      tool_choice: "auto",
      max_tokens: 2000,
      temperature: 0.7,
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    let fieldUpdates: SkillFieldUpdates | undefined;
    let replyText = assistantMessage.content || "";

    // Extract field updates from tool call if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      if ("function" in toolCall && toolCall.function.name === "update_skill_fields") {
        try {
          const args = JSON.parse(toolCall.function.arguments) as SkillFieldUpdates;
          // Filter out undefined/empty values
          fieldUpdates = Object.fromEntries(
            Object.entries(args).filter(([, v]) => v !== undefined && v !== "")
          ) as SkillFieldUpdates;

          // If the model only returned a tool call with no text, generate a follow-up response
          if (!replyText) {
            // Use the tool call to craft a summary message
            const updatedFieldNames = Object.keys(fieldUpdates).filter((k) => k !== "suggestedTags");
            replyText = updatedFieldNames.length > 0
              ? `I've updated the ${updatedFieldNames.join(", ")} field${updatedFieldNames.length > 1 ? "s" : ""}. Let me know if you'd like to adjust anything!`
              : "Let me know if you'd like to make any adjustments!";
          }
        } catch {
          // Ignore parse errors — still return the text response
        }
      }
    }

    const result: AIChatResponse = {
      message: replyText,
      ...(fieldUpdates && Object.keys(fieldUpdates).length > 0 ? { fieldUpdates } : {}),
    };

    return NextResponse.json(result);
  } catch (err) {
    const error = err as { status?: number; message?: string };
    if (error.status === 401) {
      return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 502 });
    }
    if (error.status === 429) {
      return NextResponse.json({ error: "OpenAI rate limit exceeded. Please try again." }, { status: 429 });
    }
    console.error("OpenAI API error:", error);
    return NextResponse.json({ error: "AI request failed. Please try again." }, { status: 502 });
  }
}
