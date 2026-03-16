import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSession, SESSION_DURATION_DEFAULT, SESSION_DURATION_EXTENDED } from "@/lib/auth";
import { parseJsonBody, isErrorResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const body = await parseJsonBody(req);
  if (isErrorResponse(body)) return body;

  const { username, password, rememberMe } = body as {
    username?: string;
    password?: string;
    rememberMe?: boolean;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  if (!validateCredentials(String(username), String(password))) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const remember = Boolean(rememberMe);
  const token = createSession(remember);
  const maxAge = Math.floor(
    (remember ? SESSION_DURATION_EXTENDED : SESSION_DURATION_DEFAULT) / 1000
  );

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return response;
}
