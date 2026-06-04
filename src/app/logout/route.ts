import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/features/auth/server";

export async function GET(request: Request) {
  await auth.api.signOut({
    headers: await headers(),
  });

  return NextResponse.redirect(new URL("/login", request.url));
}
