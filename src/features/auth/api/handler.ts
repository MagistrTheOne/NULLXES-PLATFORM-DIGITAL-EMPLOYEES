import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "../server";
import {
  authorizeEmailSignUp,
  INVITE_TOKEN_HEADER,
} from "../lib/public-registration";

const handler = toNextJsHandler(auth);

function isEmailSignUpPath(pathname: string): boolean {
  return (
    pathname.endsWith("/sign-up/email") ||
    pathname.includes("/sign-up/email")
  );
}

async function withAuthErrorLogging(
  request: Request,
  method: "GET" | "POST",
): Promise<Response> {
  try {
    if (method === "POST" && isEmailSignUpPath(new URL(request.url).pathname)) {
      const rawBody = await request.text();
      let email = "";
      try {
        const parsed = JSON.parse(rawBody) as { email?: unknown };
        email = typeof parsed.email === "string" ? parsed.email : "";
      } catch {
        return NextResponse.json(
          { message: "Invalid sign-up payload." },
          { status: 400 },
        );
      }

      const inviteToken = request.headers.get(INVITE_TOKEN_HEADER);
      const decision = await authorizeEmailSignUp({ email, inviteToken });
      if (!decision.ok) {
        return NextResponse.json(
          { message: decision.message },
          { status: 403 },
        );
      }

      const forwarded = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: rawBody,
      });
      return await handler.POST(forwarded);
    }

    return await handler[method](request);
  } catch (error: unknown) {
    console.error(`[auth] ${method} ${new URL(request.url).pathname}`, error);
    throw error;
  }
}

export async function GET(request: Request) {
  return withAuthErrorLogging(request, "GET");
}

export async function POST(request: Request) {
  return withAuthErrorLogging(request, "POST");
}
