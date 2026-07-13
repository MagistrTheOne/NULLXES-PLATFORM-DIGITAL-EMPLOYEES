import { NextResponse } from "next/server";
import {
  getTbankPassword,
  isTbankConfigured,
} from "@/features/billing/tbank/config";
import { verifyTbankToken } from "@/features/billing/tbank/token";

/**
 * T-Bank NotificationURL handler.
 * Must respond with plain text `OK` (HTTP 200) on success.
 * @see https://developer.tbank.ru/eacq/intro/developer/notification
 */
export async function POST(request: Request): Promise<Response> {
  if (!isTbankConfigured()) {
    return new NextResponse("NOT_CONFIGURED", { status: 503 });
  }

  const password = getTbankPassword();
  if (!password) {
    return new NextResponse("NOT_CONFIGURED", { status: 503 });
  }

  let payload: Record<string, unknown>;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      payload = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      payload = {};
      for (const [key, value] of form.entries()) {
        payload[key] = typeof value === "string" ? value : String(value);
      }
    }
  } catch {
    return new NextResponse("BAD_REQUEST", { status: 400 });
  }

  if (!verifyTbankToken(payload, password)) {
    return new NextResponse("INVALID_TOKEN", { status: 403 });
  }

  // C1: acknowledge only. Plan upgrade lands in a later iteration.
  console.info("[tbank/notification]", {
    status: payload.Status,
    orderId: payload.OrderId,
    paymentId: payload.PaymentId,
    success: payload.Success,
  });

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
