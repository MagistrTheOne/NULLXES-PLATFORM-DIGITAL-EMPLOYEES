"use client";

import { useSyncExternalStore } from "react";
import {
  applyItemToLoadout,
  cloneLoadout,
  emptyLoadout,
  getOrCreateLoadout,
  seedDemoLoadouts,
  type EmployeeLoadout,
  type LoadoutStoreSnapshot,
  type RecentEquipEvent,
} from "./loadout";
import { getRewardById } from "./catalog";

const STORAGE_KEY = "nullxes.mock.loadout.v1";

let snapshot: LoadoutStoreSnapshot = {
  loadouts: seedDemoLoadouts(),
  favorites: {
    "board-room": true,
    "exec-voice": true,
  },
  recent: [
    {
      itemId: "exec-voice",
      employeeId: "adeline",
      employeeName: "Adeline Kalen",
      at: Date.now() - 2 * 60 * 1000,
    },
    {
      itemId: "board-room",
      employeeId: "adeline",
      employeeName: "Adeline Kalen",
      at: Date.now() - 24 * 60 * 60 * 1000,
    },
  ],
};

let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as LoadoutStoreSnapshot;
    if (parsed?.loadouts) {
      snapshot = {
        loadouts: parsed.loadouts,
        favorites: parsed.favorites ?? {},
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      };
    }
  } catch {
    // keep seed
  }
}

function getSnapshot(): LoadoutStoreSnapshot {
  hydrate();
  return snapshot;
}

function getServerSnapshot(): LoadoutStoreSnapshot {
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: LoadoutStoreSnapshot) {
  snapshot = next;
  persist();
  emit();
}

export function useLoadoutStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getEmployeeLoadout(employeeId: string): EmployeeLoadout {
  const state = getSnapshot();
  return getOrCreateLoadout(state.loadouts, employeeId);
}

export function setEmployeeLoadout(
  employeeId: string,
  loadout: EmployeeLoadout,
) {
  const state = getSnapshot();
  commit({
    ...state,
    loadouts: {
      ...state.loadouts,
      [employeeId]: cloneLoadout(loadout),
    },
  });
}

export function toggleFavorite(itemId: string) {
  const state = getSnapshot();
  const next = { ...state.favorites };
  if (next[itemId]) {
    delete next[itemId];
  } else {
    next[itemId] = true;
  }
  commit({ ...state, favorites: next });
}

export function equipItemOnEmployee(input: {
  employeeId: string;
  employeeName: string;
  itemId: string;
}): { ok: true } | { ok: false; message: string } {
  const item = getRewardById(input.itemId);
  if (!item) {
    return { ok: false, message: "Item not found." };
  }

  const state = getSnapshot();
  const current = getOrCreateLoadout(state.loadouts, input.employeeId);
  const nextLoadout = applyItemToLoadout(current, item);
  const event: RecentEquipEvent = {
    itemId: item.id,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    at: Date.now(),
  };

  commit({
    ...state,
    loadouts: {
      ...state.loadouts,
      [input.employeeId]: nextLoadout,
    },
    recent: [event, ...state.recent].slice(0, 12),
  });

  return { ok: true };
}

export function ensureEmployeeLoadout(employeeId: string): EmployeeLoadout {
  const state = getSnapshot();
  if (state.loadouts[employeeId]) {
    return cloneLoadout(state.loadouts[employeeId]);
  }
  const created = emptyLoadout();
  commit({
    ...state,
    loadouts: {
      ...state.loadouts,
      [employeeId]: created,
    },
  });
  return cloneLoadout(created);
}
