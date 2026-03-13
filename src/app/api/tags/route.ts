import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createTag, listTags } from "@/lib/tags";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { name, color } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const tag = await createTag({ name, color });
  return NextResponse.json(tag, { status: 201 });
}
