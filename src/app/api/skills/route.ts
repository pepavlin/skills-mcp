import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSkill, listSkills, SkillType } from "@/lib/skills";
import { parseJsonBody, isErrorResponse } from "@/lib/api-utils";

const VALID_TYPES = ["prompt", "workflow", "technique", "snippet", "config"];

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || undefined;
  const type = searchParams.get("type") || undefined;
  const tagIds = searchParams.get("tags")?.split(",").filter(Boolean) || undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const result = await listSkills({
    query,
    type: type as SkillType | undefined,
    tagIds,
    limit,
    offset,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await parseJsonBody(req);
  if (isErrorResponse(body)) return body;

  const { name, description, content, type, parameters, examples, tagIds } =
    body as Record<string, unknown>;

  if (!name || !description || !content || !type) {
    return NextResponse.json(
      { error: "name, description, content, and type are required" },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(String(type))) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (parameters && typeof parameters === "string") {
    try {
      JSON.parse(parameters);
    } catch {
      return NextResponse.json({ error: "parameters must be valid JSON" }, { status: 400 });
    }
  }

  if (examples && typeof examples === "string") {
    try {
      JSON.parse(examples);
    } catch {
      return NextResponse.json({ error: "examples must be valid JSON" }, { status: 400 });
    }
  }

  const skill = await createSkill({
    name: String(name),
    description: String(description),
    content: String(content),
    type: String(type) as SkillType,
    parameters: parameters ? String(parameters) : undefined,
    examples: examples ? String(examples) : undefined,
    tagIds: Array.isArray(tagIds) ? tagIds.map(String) : undefined,
  });

  return NextResponse.json(skill, { status: 201 });
}
