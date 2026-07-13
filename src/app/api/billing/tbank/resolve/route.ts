import { NextResponse } from "next/server";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { isTbankConfigured } from "@/features/billing/tbank/config";
import { checkTbankOrder } from "@/features/billing/tbank/client";

/** Resolve PaymentId from OrderId (SuccessURL fallback). */
export async function POST(request: Request): Promise<Response> {
  if (!isTbankConfigured()) {
    return NextResponse.json(
      { error: "T-Bank is not configured" },
      { status: 503 },
    );
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  if (!workspace.permissions.canManageOrganization) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    orderId?: string;
  } | null;
  const orderId = body?.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  try {
    const result = await checkTbankOrder(orderId);
    if (!result.Success) {
      return NextResponse.json(
        {
          error: result.Message ?? "CheckOrder failed",
          details: result.Details,
        },
        { status: 502 },
      );
    }

    const payments = result.Payments ?? [];
    const preferred =
      payments.find((p) => {
        const status = (p.Status ?? "").toUpperCase();
        return status === "CONFIRMED" || status === "AUTHORIZED";
      }) ?? payments[0];

    const paymentId =
      preferred?.PaymentId != null
        ? String(preferred.PaymentId)
        : result.PaymentId != null
          ? String(result.PaymentId)
          : null;

    if (!paymentId) {
      return NextResponse.json(
        { error: "PaymentId not found for order" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      paymentId,
      orderId,
      status: preferred?.Status ?? result.Status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Resolve failed",
      },
      { status: 500 },
    );
  }
}
