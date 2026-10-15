/**
 * IDE layout preference for this browser.
 *
 * In IDE layout the thread's right panel becomes the main editor stage with a
 * persistent file explorer, and the chat docks as a narrow resizable column.
 * It is a per-window layout choice like panel widths, so it is not synced
 * through server settings.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "./lib/storage";

interface IdeLayoutState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const useIdeLayoutStore = create<IdeLayoutState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: "t3code:ide-layout:v1",
      version: 1,
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);
