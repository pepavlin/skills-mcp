import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getSessionFromRequest(req);
  if (!token || !validateSession(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
