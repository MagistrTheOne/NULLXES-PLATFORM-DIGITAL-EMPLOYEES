/**
 * Landing demo rate policy.
 *
 * Per-IP trial caps were blocking real demos (and Redis fail-closed looked
 * identical to "limit reached"). Public Talk/Voice skip IP/platform buckets;
 * only a soft Anam proxy guard remains on the talk route.
 */

export const LANDING_DEMO_RATE_ENABLED = false;

/** Soft Anam proxy subject for landing Talk session starts. */
export const LANDING_DEMO_ANAM_PROXY = {
  subject: "demo:landing-anna",
  perMinute: 120,
  failOpen: true as const,
};
