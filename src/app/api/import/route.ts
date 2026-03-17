import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { importSkills, validateBackupData, ImportMode } from "@/lib/backup";

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  let data: unknown;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const text = await file.text();
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }
  } else if (contentType.includes("application/json")) {
    try {
      data = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  } else {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data or application/json" },
      { status: 415 }
    );
  }

  if (!validateBackupData(data)) {
    return NextResponse.json(
      { error: "Invalid backup format. Expected {version, exportedAt, tags, skills}." },
      { status: 422 }
    );
  }

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "skip") as ImportMode;
  if (mode !== "skip" && mode !== "overwrite") {
    return NextResponse.json(
      { error: "mode must be 'skip' or 'overwrite'" },
      { status: 400 }
    );
  }

  const result = await importSkills(data, mode);
  return NextResponse.json(result, { status: 200 });
}
