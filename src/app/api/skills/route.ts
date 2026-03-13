import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSkill, listSkills, SkillType } from "@/lib/skills";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || undefined;
  const type = (searchParams.get("type") as SkillType) || undefined;
  const tagIds = searchParams.get("tags")?.split(",").filter(Boolean) || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const result = await listSkills({ query, type, tagIds, limit, offset });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { name, description, content, type, parameters, examples, tagIds } = body;

  if (!name || !description || !content || !type) {
    return NextResponse.json(
      { error: "name, description, content, and type are required" },
      { status: 400 }
    );
  }

  const skill = await createSkill({
    name,
    description,
    content,
    type,
    parameters,
    examples,
    tagIds,
  });

  return NextResponse.json(skill, { status: 201 });
}
