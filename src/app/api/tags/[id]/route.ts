import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateTag, deleteTag } from "@/lib/tags";
import { parseJsonBody, isErrorResponse } from "@/lib/api-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await parseJsonBody(req);
  if (isErrorResponse(body)) return body;

  const { name, color } = body as { name?: string; color?: string };

  if (color && !/^#[0-9a-fA-F]{6}$/.test(String(color))) {
    return NextResponse.json({ error: "color must be a valid hex color" }, { status: 400 });
  }

  const tag = await updateTag(id, {
    name: name ? String(name).trim() : undefined,
    color: color ? String(color) : undefined,
  });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
  return NextResponse.json(tag);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const deleted = await deleteTag(id);
  if (!deleted) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
