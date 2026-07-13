import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  buildTbankOrderId,
  getRubAmountKopecks,
  type SelfServeCheckoutPlanId,
} from "@/features/billing/config/rub-pricing";
import type { BillingInterval } from "@/features/billing/config/plans";
import {
  getTbankTestAmountKopecks,
  isTbankConfigured,
} from "@/features/billing/tbank/config";
import { initTbankPayment } from "@/features/billing/tbank/client";

const PLAN_IDS: SelfServeCheckoutPlanId[] = [
  "starter",
  "studio",
  "operator",
  "scale",
];

function parsePlan(
  planIdRaw: string | null,
  intervalRaw: string | null,
): {
  planId: SelfServeCheckoutPlanId | "test";
  interval: BillingInterval;
} {
  const planId = PLAN_IDS.includes(planIdRaw as SelfServeCheckoutPlanId)
    ? (planIdRaw as SelfServeCheckoutPlanId)
    : "test";
  const interval: BillingInterval =
    intervalRaw === "year" ? "year" : "month";
  return { planId, interval };
}

async function createPayment(input: {
  planId: SelfServeCheckoutPlanId | "test";
  interval: BillingInterval;
}): Promise<Response> {
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

  const amountKopecks =
    input.planId === "test"
      ? getTbankTestAmountKopecks()
      : getRubAmountKopecks(input.planId, input.interval);

  if (amountKopecks == null || amountKopecks < 100) {
    return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const orderId = buildTbankOrderId({
    planId: input.planId,
    interval: input.interval,
    suffix,
  });

  const description =
    input.planId === "test"
      ? "NULLXES — тестовая оплата"
      : `NULLXES — ${input.planId} (${input.interval === "year" ? "год" : "месяц"})`;

  try {
    const result = await initTbankPayment({
      amountKopecks,
      orderId,
      description,
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
      planId: input.planId,
      interval: input.interval,
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

export async function POST(request: Request): Promise<Response> {
  const raw = (await request.json().catch(() => ({}))) as {
    planId?: string;
    interval?: string;
  };
  return createPayment(
    parsePlan(raw.planId ?? null, raw.interval ?? null),
  );
}

/** GET ?planId=&interval= → redirect to PaymentURL (auditors / deep links). */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const init = await createPayment(
    parsePlan(url.searchParams.get("planId"), url.searchParams.get("interval")),
  );
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
