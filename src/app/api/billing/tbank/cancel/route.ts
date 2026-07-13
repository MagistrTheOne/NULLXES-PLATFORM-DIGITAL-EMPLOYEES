import { NextResponse } from "next/server";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { isTbankConfigured } from "@/features/billing/tbank/config";
import { cancelTbankPayment } from "@/features/billing/tbank/client";

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
    paymentId?: string;
  } | null;
  const paymentId = body?.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  try {
    const result = await cancelTbankPayment(paymentId);
    if (!result.Success) {
      return NextResponse.json(
        {
          error: result.Message ?? "Cancel failed",
          details: result.Details,
          errorCode: result.ErrorCode,
          status: result.Status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      status: result.Status,
      paymentId: result.PaymentId,
      orderId: result.OrderId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cancel failed",
      },
      { status: 500 },
    );
  }
}
