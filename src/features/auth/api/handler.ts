import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../server";

const handler = toNextJsHandler(auth);

async function withAuthErrorLogging(
  request: Request,
  method: "GET" | "POST",
): Promise<Response> {
  try {
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
