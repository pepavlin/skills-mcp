import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStats } from "@/lib/skills";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const stats = await getStats();
  return NextResponse.json(stats);
}
