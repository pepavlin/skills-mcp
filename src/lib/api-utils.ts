import { NextRequest, NextResponse } from "next/server";

export async function parseJsonBody(req: NextRequest): Promise<Record<string, unknown> | NextResponse> {
  try {
    return await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
