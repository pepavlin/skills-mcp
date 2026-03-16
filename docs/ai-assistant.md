# AI-Assisted Skill Creation

The dashboard includes an AI assistant that helps you create and edit skills through a conversational interface. Instead of filling in all fields manually, you describe what the skill should do and the AI progressively fills in the form.

## Setup

Set the `OPENAI_API_KEY` environment variable:

```bash
# .env.local (development)
OPENAI_API_KEY=sk-...

# Docker / production
OPENAI_API_KEY=sk-... docker compose up -d
```

The assistant uses the `gpt-4o-mini` model. If `OPENAI_API_KEY` is not set, the "Fill with AI" button still appears but calls to the API will return a 503 error.

## How It Works

### UI

A **"Fill with AI"** button appears at the top of the skill form (both create and edit pages). Clicking it opens a chat panel beside the form in a split layout:

- Left side: skill form (fields remain editable at all times)
- Right side: AI chat panel

The panel can be closed at any time without losing form changes.

### Conversation Flow

1. User describes the desired skill in plain language
2. AI asks clarifying questions if needed
3. As soon as the AI has enough context, it calls the `update_skill_fields` function internally and the form fields are updated in real-time
4. Updated fields are briefly highlighted with a violet ring animation
5. The chat shows which fields were updated below each AI message
6. The user can keep chatting to refine the skill, or edit fields directly

### Field Mapping

The AI can fill in these fields:

| Field | Notes |
|---|---|
| `name` | Concise descriptive name |
| `description` | 20–200 chars; used for MCP discoverability |
| `content` | Full skill body (instructions, steps, template) |
| `type` | One of: `prompt`, `workflow`, `technique`, `snippet`, `config` |
| `suggestedTags` | Matched against existing tags by name (case-insensitive) |

### Tag Matching

The AI receives the list of existing tag names as context. When it suggests tags, the frontend maps suggested names to existing tag IDs (case-insensitive match). Tags that don't exist are ignored — they won't be auto-created.

## API

### `POST /api/ai/chat`

Requires authentication (session cookie).

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I want a skill that helps review pull requests" }
  ],
  "currentSkill": {
    "name": "...",
    "description": "...",
    "content": "...",
    "type": "prompt"
  },
  "availableTags": ["code", "review", "git"]
}
```

**Response:**
```json
{
  "message": "I've filled in the skill. Let me know if you'd like to adjust anything!",
  "fieldUpdates": {
    "name": "PR Review Assistant",
    "description": "Systematic pull request review covering code quality, logic, and style",
    "content": "When reviewing a pull request, follow these steps:\n...",
    "type": "workflow",
    "suggestedTags": ["code", "review"]
  }
}
```

`fieldUpdates` is omitted when the AI only sends a conversational response (e.g., asking a clarifying question).

**Error responses:**
- `400` — Invalid request (missing messages, bad format)
- `401` — Not authenticated
- `429` — OpenAI rate limit exceeded
- `502` — OpenAI API error (includes invalid key)
- `503` — `OPENAI_API_KEY` not configured

## Architecture

```
Frontend (SkillForm)
  └── AIAssistantPanel
        ├── Maintains local chat history (display only)
        ├── Sends API-format messages to /api/ai/chat
        └── Calls onFieldsUpdate() callback with field changes

Backend (/api/ai/chat)
  ├── Validates auth + request
  ├── Builds system prompt with current skill context
  ├── Calls OpenAI chat completions with function calling
  │     └── Tool: update_skill_fields (extracts structured skill data)
  └── Returns { message, fieldUpdates }
```

The AI assistant panel maintains two separate message lists:
- **Display messages** — includes the initial greeting and tracks which fields were updated per message
- **API messages** — only user/assistant exchanges sent to OpenAI (no greeting, no metadata)

This separation keeps the OpenAI context clean while giving the user a richer display.
