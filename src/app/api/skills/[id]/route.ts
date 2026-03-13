import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSkill, updateSkill, deleteSkill } from "@/lib/skills";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const skill = await getSkill(id);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json(skill);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const skill = await updateSkill(id, body);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json(skill);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const deleted = await deleteSkill(id);
  if (!deleted) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
