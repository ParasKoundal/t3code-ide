import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { resolveStorage } from "./lib/storage";
import type { OpenVsxExtension } from "./openVsxExtensions";
import { importOpenVsxThemeExtension, type OpenVsxThemeExtension } from "./openVsxThemes";
import { replaceCustomThemeCollection, removeCustomThemes } from "./themePalette";

export interface InstalledExtension {
  id: string; // "namespace.name"
  namespace: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  iconUrl: string | null;
  sourceUrl: string | null;
  homepageUrl: string | null;
  categories: string[];
  license: string | null;
  enabled: boolean;
  installedAt: string;
  isTheme?: boolean | undefined;
  themeIds?: string[] | undefined;
}

interface ExtensionsStoreState {
  installedExtensions: Record<string, InstalledExtension>;
  installingExtensionIds: Record<string, boolean>;
  extensionErrors: Record<string, string | null>;

  installExtension: (extension: OpenVsxExtension) => Promise<boolean>;
  uninstallExtension: (id: string) => Promise<void>;
  toggleExtension: (id: string) => void;
  isInstalled: (id: string) => boolean;
  clearError: (id: string) => void;
}

export const useExtensionsStore = create<ExtensionsStoreState>()(
  persist(
    (set, get) => ({
      installedExtensions: {},
      installingExtensionIds: {},
      extensionErrors: {},

      isInstalled: (id) => {
        return Boolean(get().installedExtensions[id]);
      },

      clearError: (id) => {
        set((state) => ({
          extensionErrors: {
            ...state.extensionErrors,
            [id]: null,
          },
        }));
      },

      installExtension: async (extension: OpenVsxExtension): Promise<boolean> => {
        const { id } = extension;
        set((state) => ({
          installingExtensionIds: { ...state.installingExtensionIds, [id]: true },
          extensionErrors: { ...state.extensionErrors, [id]: null },
        }));

        try {
          const isTheme =
            extension.categories.some(
              (cat) => cat.toLowerCase().includes("theme") || cat.toLowerCase().includes("color"),
            ) ||
            extension.displayName.toLowerCase().includes("theme") ||
            extension.name.toLowerCase().includes("theme");

          let themeIds: string[] | undefined;

          // If extension contributes themes, attempt to download and import them
          if (isTheme && extension.manifestUrl && extension.vsixUrl) {
            try {
              const themeExt: OpenVsxThemeExtension = {
                id: extension.id,
                collectionId: extension.id,
                name: extension.displayName || extension.name,
                publisher: extension.namespace,
                description: extension.description,
                downloadCount: extension.downloadCount,
                iconUrl: extension.iconUrl,
                sourceUrl: extension.sourceUrl,
                manifestUrl: extension.manifestUrl,
                vsixUrl: extension.vsixUrl,
                sha256Url: extension.sha256Url ?? "",
                version: extension.version,
                license: extension.license ?? "",
              };
              if (extension.sha256Url) {
                const importedThemes = await importOpenVsxThemeExtension(themeExt);
                if (importedThemes.length > 0) {
                  replaceCustomThemeCollection(id, importedThemes);
                  themeIds = importedThemes.map((t) => t.id);
                }
              }
            } catch {
              // Non-critical: If strict checksum or zip extraction fails in web mode,
              // we still register the extension in installedExtensions as an IDE extension.
            }
          }

          const installed: InstalledExtension = {
            id,
            namespace: extension.namespace,
            name: extension.name,
            displayName: extension.displayName,
            description: extension.description,
            version: extension.version,
            iconUrl: extension.iconUrl,
            sourceUrl: extension.sourceUrl,
            homepageUrl: extension.homepageUrl,
            categories: extension.categories,
            license: extension.license,
            enabled: true,
            installedAt: new Date().toISOString(),
            isTheme,
            themeIds,
          };

          set((state) => ({
            installedExtensions: {
              ...state.installedExtensions,
              [id]: installed,
            },
            installingExtensionIds: {
              ...state.installingExtensionIds,
              [id]: false,
            },
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to install extension";
          set((state) => ({
            installingExtensionIds: {
              ...state.installingExtensionIds,
              [id]: false,
            },
            extensionErrors: {
              ...state.extensionErrors,
              [id]: message,
            },
          }));
          return false;
        }
      },

      uninstallExtension: async (id: string): Promise<void> => {
        const ext = get().installedExtensions[id];
        if (!ext) return;

        if (ext.themeIds && ext.themeIds.length > 0) {
          try {
            removeCustomThemes(ext.themeIds);
          } catch {
            // Ignore removal errors
          }
        }

        set((state) => {
          const next = { ...state.installedExtensions };
          delete next[id];
          return { installedExtensions: next };
        });
      },

      toggleExtension: (id: string) => {
        const ext = get().installedExtensions[id];
        if (!ext) return;

        set((state) => ({
          installedExtensions: {
            ...state.installedExtensions,
            [id]: {
              ...ext,
              enabled: !ext.enabled,
            },
          },
        }));
      },
    }),
    {
      name: "t3code:extensions:v1",
      version: 1,
      storage: createJSONStorage(() =>
        resolveStorage(typeof window !== "undefined" ? window.localStorage : undefined),
      ),
      partialize: (state) => ({
        installedExtensions: state.installedExtensions,
      }),
    },
  ),
);
