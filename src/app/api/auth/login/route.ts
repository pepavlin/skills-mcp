import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  if (!validateCredentials(username, password)) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = createSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400, // 24 hours
    path: "/",
  });

  return response;
}
