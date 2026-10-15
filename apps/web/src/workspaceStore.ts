/**
 * Workspaces: named sets of projects the user works on together.
 *
 * A workspace scopes the sidebar's thread list and the IDE explorer to its
 * projects. Members are physical project refs (`environmentId:projectId`), so a
 * workspace may span machines and survives changes to sidebar grouping. No
 * single environment owns a cross-machine workspace, so it persists with this
 * client's other sidebar preferences rather than in one server's state.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveStorage } from "./lib/storage";
import { randomUUID } from "./lib/utils";

export interface Workspace {
  readonly id: string;
  readonly name: string;
  /** Physical project refs: `${environmentId}:${projectId}`. */
  readonly projectRefKeys: readonly string[];
}

const WORKSPACE_SCOPE_PREFIX = "workspace:";

/** Sidebar scope key for a workspace, stored beside single-project scope keys. */
export function workspaceScopeKey(workspaceId: string): string {
  return `${WORKSPACE_SCOPE_PREFIX}${workspaceId}`;
}

export function parseWorkspaceScopeKey(key: string | null | undefined): string | null {
  return key?.startsWith(WORKSPACE_SCOPE_PREFIX) ? key.slice(WORKSPACE_SCOPE_PREFIX.length) : null;
}

export function normalizeWorkspaceInput(input: {
  readonly name: string;
  readonly projectRefKeys: Iterable<string>;
}): { name: string; projectRefKeys: string[] } | null {
  const name = input.name.trim().replace(/\s+/g, " ");
  const projectRefKeys = [...new Set(input.projectRefKeys)].filter((key) => key.includes(":"));
  if (name.length === 0 || projectRefKeys.length === 0) return null;
  return { name: name.slice(0, 80), projectRefKeys };
}

interface WorkspaceStoreState {
  workspaces: Workspace[];
  /** Returns the new workspace id, or null when the input has no name or projects. */
  create: (input: { name: string; projectRefKeys: Iterable<string> }) => string | null;
  update: (id: string, input: { name: string; projectRefKeys: Iterable<string> }) => boolean;
  remove: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set) => ({
      workspaces: [],
      create: (input) => {
        const normalized = normalizeWorkspaceInput(input);
        if (!normalized) return null;
        const id = randomUUID();
        set((state) => ({ workspaces: [...state.workspaces, { id, ...normalized }] }));
        return id;
      },
      update: (id, input) => {
        const normalized = normalizeWorkspaceInput(input);
        if (!normalized) return false;
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === id ? { id, ...normalized } : workspace,
          ),
        }));
        return true;
      },
      remove: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((workspace) => workspace.id !== id),
        })),
    }),
    {
      name: "t3code:workspaces:v1",
      version: 1,
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({ workspaces: state.workspaces }),
    },
  ),
);
