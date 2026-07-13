# NULLXES Avatar Rendering Specification

**Version:** 1.0  
**Status:** Canonical — freeze Talk video chrome separately from this asset standard  
**Audience:** Studio operators, avatar vendors, Cursor agents  

## Principle

The Anam **player** (video element + `object-fit` / `object-position`) is frozen in product UI.

Visual consistency across dozens of digital employees comes from **standardized assets and capture**, not per-employee CSS.

> Do not change `.employee-anam-video` `object-fit` / crop per employee.  
> Fix framing in the source avatar / one-shot capture instead.

## Camera standard (NULLXES Camera Standard)

| Parameter | Value | Notes |
|-----------|--------|--------|
| Aspect ratio | **16:9** | Matches Talk stage frame |
| Headroom | **8%** | Space above crown to top of frame |
| Eyes vertical | **~42%** from top | Eyes sit in upper-mid safe band |
| Shoulders | **≥18%** of frame height visible | Avoid tight head-crops |
| Bottom clearance | **~12%** | Chest / upper torso, not cut at chin |
| Background | Neutral / product-approved | Prefer dark or soft studio; no busy patterns |

## Safe area

All faces, hair, and shoulders must stay inside the inner safe band:

```text
┌────────────────────────────────────────┐
│  ~8% headroom                          │
│   ┌──────────────────────────────┐     │
│   │                              │     │
│   │     FACE + SHOULDERS         │     │
│   │     (safe area)              │     │
│   │                              │     │
│   └──────────────────────────────┘     │
│  ~12% bottom                           │
└────────────────────────────────────────┘
```

Outside the safe area may be cropped by the frozen `object-fit: cover` stage. Design captures so critical features never rely on the outer margin.

## Product UI (Talk) — frozen player

Allowed to change (chrome only):

- Stage frame border / inset shadow  
- Docked controls  
- HUD / logo opacity & motion  
- Overlays, focus mode, PiP  

**Not allowed without CEO-level review:**

- `.employee-anam-video` `object-fit`  
- Per-employee `object-position` overrides  
- Changing stage aspect away from 16:9 without updating this spec  

Live CSS: `src/features/runtime-session/components/employee-talk-theme.css`  
Mark: `/* NULLXES AVATAR PLAYER — FROZEN */`

## Checklist for new employees

- [ ] Capture / one-shot is 16:9 or safely croppable to 16:9  
- [ ] Eyes near 42% from top after crop  
- [ ] Shoulders visible (≥18%)  
- [ ] Preview still looks correct on `/talk` without CSS tweaks  
- [ ] No request to “nudge object-position for this person”

## Related

- Talk architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
- Live docs: `/docs/architecture`  
