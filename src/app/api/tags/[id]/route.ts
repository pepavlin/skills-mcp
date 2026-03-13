import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateTag, deleteTag } from "@/lib/tags";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const tag = await updateTag(id, body);
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
