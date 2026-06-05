import { Checkout } from "@polar-sh/nextjs";
import {
  getPolarAccessToken,
  getPolarReturnUrl,
  getPolarServer,
  getPolarSuccessUrl,
} from "@/features/billing/services/polar-config";

const accessToken = getPolarAccessToken();

export const GET = accessToken
  ? Checkout({
      accessToken,
      successUrl: getPolarSuccessUrl(),
      returnUrl: getPolarReturnUrl(),
      server: getPolarServer(),
      theme: "dark",
    })
  : async () =>
      new Response(JSON.stringify({ error: "Polar is not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
