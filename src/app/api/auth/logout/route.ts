import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  destroySession();
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
