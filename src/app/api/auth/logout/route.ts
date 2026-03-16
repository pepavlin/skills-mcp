import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = getSessionFromRequest(req);
  if (token) destroySession(token);
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
