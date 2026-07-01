import { createClient, type AnamClient } from "@anam-ai/js-sdk";
import { buildAnamTalkClientOptions } from "./anam-talk-client-options";
import { patchAnamBrowserFetch } from "./patch-anam-browser-fetch";

patchAnamBrowserFetch();

/**
 * Anam browser SDK calls are patched to use /api/anam (see patch-anam-browser-fetch).
 * Client metrics are dropped; session start is proxied server-side to avoid CORS.
 */
export function createAnamTalkClient(sessionToken: string): AnamClient {
  patchAnamBrowserFetch();

  return createClient(sessionToken, buildAnamTalkClientOptions());
}
