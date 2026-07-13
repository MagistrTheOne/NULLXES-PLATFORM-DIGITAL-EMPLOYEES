"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DocsMermaidProps = {
  chart: string;
  className?: string;
  title?: string;
};

/**
 * Client-side Mermaid renderer for the docs portal.
 * Diagrams stay as source text in the page — easy for Cursor to edit.
 */
export function DocsMermaid({ chart, className, title }: DocsMermaidProps) {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) {
        return;
      }

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
          darkMode: true,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            primaryColor: "#111111",
            primaryTextColor: "#ffffff",
            primaryBorderColor: "#333333",
            lineColor: "#888888",
            secondaryColor: "#0a0a0a",
            tertiaryColor: "#1a1a1a",
            background: "#000000",
            mainBkg: "#111111",
            nodeBorder: "#444444",
            clusterBkg: "#0a0a0a",
            titleColor: "#ffffff",
            edgeLabelBackground: "#111111",
          },
        });

        const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (cancelled || !containerRef.current) {
          return;
        }
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Mermaid render failed");
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  return (
    <figure className={cn("overflow-x-auto", className)}>
      {title ? (
        <figcaption className="mb-3 text-xs uppercase tracking-[0.14em] text-white/40">
          {title}
        </figcaption>
      ) : null}
      {error ? (
        <pre className="rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] text-red-300/90">
          {error}
          {"\n\n"}
          {chart.trim()}
        </pre>
      ) : (
        <div
          ref={containerRef}
          className="rounded-xl border border-white/8 bg-black/40 p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
          aria-label={title ?? "Architecture diagram"}
        />
      )}
    </figure>
  );
}
