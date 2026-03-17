import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { exportSkills } from "@/lib/backup";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const data = await exportSkills();
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().split("T")[0];
  const filename = `skills-backup-${date}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
