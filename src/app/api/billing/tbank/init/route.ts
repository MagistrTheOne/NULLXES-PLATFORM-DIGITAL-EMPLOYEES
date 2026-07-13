import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  getTbankTestAmountKopecks,
  isTbankConfigured,
} from "@/features/billing/tbank/config";
import { initTbankPayment } from "@/features/billing/tbank/client";

/**
 * Start a T-Bank verification payment (RU acquiring tests).
 * Auth required — use acquiring@ auditor or org admin.
 */
export async function POST(): Promise<Response> {
  if (!isTbankConfigured()) {
    return NextResponse.json(
      { error: "T-Bank is not configured" },
      { status: 503 },
    );
  }

  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  if (!workspace.permissions.canManageOrganization) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const amountKopecks = getTbankTestAmountKopecks();
  const orderId = `nx-test-${Date.now()}-${randomUUID().slice(0, 8)}`.slice(
    0,
    50,
  );

  try {
    const result = await initTbankPayment({
      amountKopecks,
      orderId,
      description: "NULLXES — тестовая оплата тарифа",
      customerKey: workspace.organization.id,
      customerEmail: session.user.email,
      language: "ru",
    });

    if (!result.Success || !result.PaymentURL) {
      return NextResponse.json(
        {
          error: result.Message ?? "Init failed",
          details: result.Details,
          errorCode: result.ErrorCode,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      paymentUrl: result.PaymentURL,
      paymentId: result.PaymentId,
      orderId: result.OrderId ?? orderId,
      amountKopecks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Init failed",
      },
      { status: 500 },
    );
  }
}

/** GET → redirect to PaymentURL (convenient for auditors). */
export async function GET(): Promise<Response> {
  const init = await POST();
  if (!init.ok) {
    const body = await init.text();
    return new NextResponse(body, {
      status: init.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = (await init.json()) as { paymentUrl?: string };
  if (!data.paymentUrl) {
    return NextResponse.json({ error: "No PaymentURL" }, { status: 502 });
  }

  return NextResponse.redirect(data.paymentUrl, 303);
}
