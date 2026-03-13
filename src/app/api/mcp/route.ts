import { NextRequest, NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createMcpServer } from "@/mcp/server";

// Simple JSON-RPC proxy: accepts MCP JSON-RPC over HTTP POST, returns response.
// This avoids the complexity of StreamableHTTPServerTransport with Next.js edge runtime.
// Compatible with MCP clients that support the "url" transport type.

let serverInstance: McpServer | null = null;
let clientInstance: Client | null = null;

async function ensureConnection() {
  if (serverInstance && clientInstance) return { server: serverInstance, client: clientInstance };

  const server = createMcpServer();
  const client = new Client({ name: "http-proxy", version: "1.0.0" });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  serverInstance = server;
  clientInstance = client;

  return { server, client };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { server } = await ensureConnection();

    // Forward JSON-RPC directly to the server transport
    // For stateless operation, create fresh server per request
    const freshServer = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const freshClient = new Client({ name: "http-proxy", version: "1.0.0" });

    await Promise.all([
      freshServer.connect(serverTransport),
      freshClient.connect(clientTransport),
    ]);

    // Route the JSON-RPC method
    let result: unknown;
    const { method, params, id } = body;

    if (method === "initialize") {
      result = {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: "ai-skills", version: "1.0.0" },
      };
    } else if (method === "tools/list") {
      result = await freshClient.listTools();
    } else if (method === "tools/call") {
      result = await freshClient.callTool({
        name: params.name,
        arguments: params.arguments || {},
      });
    } else {
      await freshServer.close();
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        },
        { status: 200 }
      );
    }

    await freshServer.close();

    return NextResponse.json({
      jsonrpc: "2.0",
      result,
      id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: String(error) },
        id: null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "ai-skills",
    version: "1.0.0",
    description: "AI Skills MCP Server - search and retrieve AI skills, prompts, and techniques",
    endpoints: {
      mcp: "POST /api/mcp",
    },
  });
}
