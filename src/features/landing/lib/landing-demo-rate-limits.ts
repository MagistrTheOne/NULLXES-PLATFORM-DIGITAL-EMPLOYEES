/**
 * Landing demo rate policy.
 *
 * Per-IP trial caps were blocking real demos (and Redis fail-closed looked
 * identical to "limit reached"). Public Talk/Voice skip IP/platform buckets;
 * Anam proxy Redis buckets are also off unless ANAM_PROXY_QUOTA_ENABLED=1.
 */

export const LANDING_DEMO_RATE_ENABLED = false;
