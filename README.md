# AI Skills MCP

Personal AI skills knowledge base with MCP (Model Context Protocol) integration. Store, organize, and serve your AI skills/prompts/techniques through a web dashboard and an MCP server that AI assistants can query directly.

## Features

- **Web Dashboard** — Admin UI for creating, editing, searching, and organizing AI skills
- **MCP Server** — Exposes skills as MCP tools so AI assistants (Claude Code, Cursor, etc.) can search and retrieve skills
- **Skill Types** — Prompts, workflows, techniques, snippets, configs
- **Tagging System** — Organize skills with colored tags
- **Token Tracking** — Estimates token count per skill with budget warnings
- **SKILL.md Export** — Compatible with the Agent Skills standard (agentskills.io)

## Tech Stack

- Next.js 15 (App Router)
- SQLite + Drizzle ORM
- shadcn/ui + Tailwind CSS
- @modelcontextprotocol/sdk

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local to set ADMIN_USERNAME and ADMIN_PASSWORD
```

### 3. Initialize the database

```bash
npm run db:migrate
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials (default: admin/admin).

## Docker

```bash
# Default port 3000
docker compose up -d

# Custom port
PORT=8080 docker compose up -d
```

The database is persisted in a Docker volume (`skills-data`). Configure credentials via environment variables or `.env` file.

## MCP Server Setup

Add this to your Claude Code MCP configuration (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "ai-skills": {
      "command": "npx",
      "args": ["tsx", "src/mcp/stdio.ts"],
      "cwd": "/absolute/path/to/skills-mcp"
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|---|---|
| `search_skills` | Search skills by keyword, tags, or type |
| `get_skill` | Get full content of a specific skill |
| `list_skills` | Browse all skills with optional filters |
| `list_tags` | List available tags/categories |

## Project Structure

```
src/
├── app/                 # Next.js pages & API routes
│   ├── api/             # REST API (skills, tags, auth)
│   ├── dashboard/       # Admin dashboard pages
│   └── login/           # Login page
├── components/          # React components (skill-form, ui/)
├── db/                  # Database schema & migrations
├── lib/                 # Business logic (skills, tags, auth)
├── mcp/                 # MCP server (stdio transport)
└── test/                # Tests
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Initialize/migrate the database |
| `npm run mcp:stdio` | Run MCP server standalone |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Data Model

- **Skills** — id, name, slug, description, content, type, parameters (JSON), examples (JSON), token estimate
- **Tags** — id, name, color
- **Skill-Tags** — many-to-many relationship
