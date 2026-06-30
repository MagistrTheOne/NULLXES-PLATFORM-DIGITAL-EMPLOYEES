import type { BrainProvider } from "@/entities/digital-employee";

export type BrainProviderReadiness = "ready" | "configure" | "managed";

export type BrainProviderReadinessMap = Record<
  BrainProvider,
  BrainProviderReadiness
>;
