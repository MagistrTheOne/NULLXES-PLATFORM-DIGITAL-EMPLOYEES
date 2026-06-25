"use client";

import { useCallback, useEffect, useState } from "react";
import { generateHqThoughtsAction } from "../actions/generate-thoughts";
import type { EmployeeThoughtsMap } from "../services/generate-employee-thoughts";

/**
 * Loads LLM-generated lofi thoughts once on mount (cached server-side) and
 * exposes a manual refresh. Never throws; on failure the map stays empty and
 * the floor uses the curated fallback thoughts.
 */
export function useHqThoughts() {
  const [thoughts, setThoughts] = useState<EmployeeThoughtsMap>({});
  const [loading, setLoading] = useState(false);

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

  return {
    thoughts,
    loading,
    refresh: useCallback(() => load(true), [load]),
  };
}
