import { Polar } from "@polar-sh/sdk";
import {
  getPolarAccessToken,
  getPolarServer,
  isPolarConfigured,
} from "./polar-config";

let polarClient: Polar | null = null;

export function getPolarClient(): Polar {
  const accessToken = getPolarAccessToken();
  if (!accessToken) {
    throw new Error("Polar is not configured");
  }

  if (!polarClient) {
    polarClient = new Polar({
      accessToken,
      server: getPolarServer(),
    });
  }

  return polarClient;
}

export function tryGetPolarClient(): Polar | null {
  if (!isPolarConfigured()) {
    return null;
  }

  return getPolarClient();
}
