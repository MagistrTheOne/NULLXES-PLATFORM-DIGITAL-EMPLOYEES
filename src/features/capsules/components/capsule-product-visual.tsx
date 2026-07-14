"use client";

import { Component, type ReactNode, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { CapsuleTierId } from "@/features/rewards/lib/catalog";
import { getCapsuleAsset } from "../lib/capsule-assets";

const CapsuleScene = dynamic(() => import("./capsule-scene"), {
  ssr: false,
  loading: () => null,
});

class Capsule3dBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Product capsule visual for store cards.
 * PNG is source of truth until 3D maps are confirmed loaded (avoids white flash).
 */
export function CapsuleProductVisual({
  tier,
  className,
}: {
  tier: CapsuleTierId;
  className?: string;
}) {
  const asset = getCapsuleAsset(tier);
  const reduceMotion = useReducedMotion();
  const [allow3d, setAllow3d] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setAllow3d(!reduceMotion);
    setSceneReady(false);
  }, [reduceMotion, tier]);

  const onSceneReady = useCallback((ready: boolean) => {
    setSceneReady(ready);
  }, []);

  const try3d = allow3d && !failed;
  const show3d = try3d && sceneReady;

  return (
    <motion.div
      className={cn(
        "relative mx-auto h-52 w-full overflow-hidden rounded-xl bg-[#0c0c0c]",
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_65%)]" />

      <motion.div
        className="absolute inset-0"
        animate={
          reduceMotion
            ? undefined
            : {
                y: hovered ? -4 : [0, -3, 0],
                scale: hovered ? 1.03 : 1,
              }
        }
        transition={
          hovered
            ? { duration: 0.35, ease: "easeOut" }
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Always keep PNG until textured 3D is ready — never flash white mesh */}
        <Image
          src={asset.preview}
          alt={`${asset.label} capsule`}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className={cn(
            "object-contain p-3 transition-opacity duration-500",
            show3d ? "opacity-0" : "opacity-100",
          )}
          priority={tier === "daily"}
        />

        {try3d ? (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              show3d ? "opacity-100" : "opacity-0",
            )}
          >
            <Capsule3dBoundary
              onError={() => {
                setFailed(true);
                setSceneReady(false);
              }}
            >
              <CapsuleScene glb={asset.glb} onReady={onSceneReady} />
            </Capsule3dBoundary>
          </div>
        ) : null}
      </motion.div>

      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.18em] text-white/35 uppercase">
        {asset.tierLabel}
      </p>
    </motion.div>
  );
}
