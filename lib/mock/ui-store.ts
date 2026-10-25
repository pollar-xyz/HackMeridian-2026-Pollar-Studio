"use client";

import { create } from "zustand";

export type SettingsSection = "profile" | "billing" | "usage" | "plan";

// Session only UI state, not persisted.
interface UiState {
  creditsOpen: boolean;
  setCreditsOpen(open: boolean): void;
  settings: SettingsSection | null;
  openSettings(section?: SettingsSection): void;
  closeSettings(): void;
}

export const useUiStore = create<UiState>((set) => ({
  creditsOpen: false,
  setCreditsOpen: (open) => set({ creditsOpen: open }),
  settings: null,
  openSettings: (section = "profile") => set({ settings: section, creditsOpen: false }),
  closeSettings: () => set({ settings: null }),
}));
