import { createMcpServer } from "@/mcp/server";
import {
  WebStandardStreamableHTTPServerTransport,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

// Stateless MCP endpoint: each request creates a fresh server+transport pair.
// Compatible with MCP clients that use the "url" transport type.

async function handleMcpRequest(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true,
  });

  const server = createMcpServer();
  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    await server.close();
    await transport.close();
  }
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
