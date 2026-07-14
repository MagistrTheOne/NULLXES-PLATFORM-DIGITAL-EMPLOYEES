import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  buildTbankCapsuleOrderId,
  getCapsuleRubAmountKopecks,
  isPaidCapsuleTierId,
  type PaidCapsuleTierId,
} from "@/features/billing/config/capsule-pricing";
import {
  buildTbankOrderId,
  getRubAmountKopecks,
  type SelfServeCheckoutPlanId,
} from "@/features/billing/config/rub-pricing";
import type { BillingInterval } from "@/features/billing/config/plans";
import { isTbankConfigured } from "@/features/billing/tbank/config";
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
  planId: SelfServeCheckoutPlanId | null;
  interval: BillingInterval;
} {
  const planId = PLAN_IDS.includes(planIdRaw as SelfServeCheckoutPlanId)
    ? (planIdRaw as SelfServeCheckoutPlanId)
    : null;
  const interval: BillingInterval =
    intervalRaw === "year" ? "year" : "month";
  return { planId, interval };
}

async function requireCheckoutWorkspace(): Promise<
  | {
      ok: true;
      organizationId: string;
      email: string;
    }
  | { ok: false; response: Response }
> {
  if (!isTbankConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "T-Bank is not configured" },
        { status: 503 },
      ),
    };
  }

  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    organizationId: workspace.organization.id,
    email: session.user.email,
  };
}

async function createPlanPayment(input: {
  planId: SelfServeCheckoutPlanId;
  interval: BillingInterval;
}): Promise<Response> {
  const auth = await requireCheckoutWorkspace();
  if (!auth.ok) return auth.response;

  const amountKopecks = getRubAmountKopecks(input.planId, input.interval);
  if (amountKopecks == null || amountKopecks < 100) {
    return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const orderId = buildTbankOrderId({
    planId: input.planId,
    interval: input.interval,
    suffix,
  });

  const description = `NULLXES — ${input.planId} (${input.interval === "year" ? "год" : "месяц"})`;

  try {
    const result = await initTbankPayment({
      amountKopecks,
      orderId,
      description,
      customerKey: auth.organizationId,
      customerEmail: auth.email,
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

async function createCapsulePayment(tierId: PaidCapsuleTierId): Promise<Response> {
  const auth = await requireCheckoutWorkspace();
  if (!auth.ok) return auth.response;

  const amountKopecks = getCapsuleRubAmountKopecks(tierId);
  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const orderId = buildTbankCapsuleOrderId({ tierId, suffix });
  const label = tierId === "standard" ? "Diamond Capsule" : "Gold Capsule";

  try {
    const result = await initTbankPayment({
      amountKopecks,
      orderId,
      description: `NULLXES — ${label}`,
      customerKey: auth.organizationId,
      customerEmail: auth.email,
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
      product: "capsule",
      tierId,
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
    product?: string;
    tierId?: string;
  };

  if (raw.product === "capsule") {
    if (!raw.tierId || !isPaidCapsuleTierId(raw.tierId)) {
      return NextResponse.json(
        { error: "tierId required (standard|executive)" },
        { status: 400 },
      );
    }
    return createCapsulePayment(raw.tierId);
  }

  const parsed = parsePlan(raw.planId ?? null, raw.interval ?? null);
  if (!parsed.planId) {
    return NextResponse.json(
      { error: "planId required (starter|studio|operator|scale)" },
      { status: 400 },
    );
  }
  return createPlanPayment({ planId: parsed.planId, interval: parsed.interval });
}

/** GET ?planId=&interval= → redirect to PaymentURL. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const product = url.searchParams.get("product");
  if (product === "capsule") {
    const tierId = url.searchParams.get("tierId");
    if (!tierId || !isPaidCapsuleTierId(tierId)) {
      return NextResponse.json(
        { error: "tierId required (standard|executive)" },
        { status: 400 },
      );
    }
    const init = await createCapsulePayment(tierId);
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

  const parsed = parsePlan(
    url.searchParams.get("planId"),
    url.searchParams.get("interval"),
  );
  if (!parsed.planId) {
    return NextResponse.json(
      { error: "planId required (starter|studio|operator|scale)" },
      { status: 400 },
    );
  }

  const init = await createPlanPayment({
    planId: parsed.planId,
    interval: parsed.interval,
  });
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
