#!/usr/bin/env node

/**
 * MCP Server entry point for stdio transport.
 *
 * Usage in Claude Code config:
 * {
 *   "mcpServers": {
 *     "ai-skills": {
 *       "command": "npx",
 *       "args": ["tsx", "src/mcp/stdio.ts"],
 *       "cwd": "/path/to/skills-mcp"
 *     }
 *   }
 * }
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import Module from "module";
import { createMcpServer } from "./server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

// Register path alias for @/* imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModuleAny = Module as any;
const originalResolveFilename = ModuleAny._resolveFilename;
ModuleAny._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown
) {
  if (request.startsWith("@/")) {
    request = path.join(projectRoot, "src", request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Set DATABASE_PATH if not already set
if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = path.join(projectRoot, "data", "skills.db");
}

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Skills MCP server started on stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
