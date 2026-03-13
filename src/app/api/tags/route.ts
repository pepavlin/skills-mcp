import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createTag, listTags } from "@/lib/tags";
import { parseJsonBody, isErrorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await parseJsonBody(req);
  if (isErrorResponse(body)) return body;

  const { name, color } = body as { name?: string; color?: string };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (color && !/^#[0-9a-fA-F]{6}$/.test(String(color))) {
    return NextResponse.json({ error: "color must be a valid hex color (e.g. #3b82f6)" }, { status: 400 });
  }

  const tag = await createTag({ name: name.trim(), color: color ? String(color) : undefined });
  return NextResponse.json(tag, { status: 201 });
}
