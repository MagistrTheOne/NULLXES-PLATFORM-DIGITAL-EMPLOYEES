"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateHqThoughtsAction } from "../actions/generate-thoughts";
import type { EmployeeThoughtsMap } from "../services/generate-employee-thoughts";

/**
 * Loads LLM-generated speech lines for the floor. Re-fetches when
 * `contextKey` changes (roster status / mission fingerprint). Empty map =
 * no bubbles — never falls back to curated simulation quotes.
 */
export function useHqThoughts(contextKey?: string) {
  const [thoughts, setThoughts] = useState<EmployeeThoughtsMap>({});
  const [loading, setLoading] = useState(false);
  const lastKeyRef = useRef<string | undefined>(undefined);

  const load = useCallback(async (force: boolean) => {
    setLoading(true);
    try {
      const result = await generateHqThoughtsAction(force);
      setThoughts(result ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  // When live floor context shifts, pull a fresh LLM batch (server cache key
  // already includes the fingerprint, so this is a real regenerate).
  useEffect(() => {
    if (!contextKey) {
      return;
    }
    if (lastKeyRef.current === undefined) {
      lastKeyRef.current = contextKey;
      return;
    }
    if (lastKeyRef.current === contextKey) {
      return;
    }
    lastKeyRef.current = contextKey;
    void load(false);
  }, [contextKey, load]);

  return {
    thoughts,
    loading,
    refresh: useCallback(() => load(true), [load]),
  };
}
