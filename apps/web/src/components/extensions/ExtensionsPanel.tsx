import {
  type ComponentProps,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Blocks,
  Check,
  Download,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  type OpenVsxExtension,
  POPULAR_EXTENSIONS,
  searchOpenVsxExtensions,
} from "~/openVsxExtensions";
import { type InstalledExtension, useExtensionsStore } from "~/extensionsStore";
import { useTheme } from "~/hooks/useTheme";

interface ExtensionsPanelProps {
  onClose?: () => void;
  className?: string;
}

type TabMode = "marketplace" | "installed";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Languages", value: "Programming Languages" },
  { label: "Themes", value: "Themes" },
  { label: "Formatters", value: "Formatters" },
  { label: "Linters", value: "Linters" },
  { label: "Snippets", value: "Snippets" },
] as const;

function formatDownloadCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}k`;
  }
  return String(count);
}

function ExtensionIcon(props: { iconUrl: string | null; name: string; className?: string }) {
  const [imageError, setImageError] = useState(false);

  if (!props.iconUrl || imageError) {
    return (
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase text-muted-foreground",
          props.className,
        )}
      >
        {props.name.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={props.iconUrl}
      alt={props.name}
      onError={() => setImageError(true)}
      className={cn("size-10 shrink-0 rounded-md object-contain", props.className)}
      loading="lazy"
    />
  );
}

export function ExtensionsPanel({ onClose, className }: ExtensionsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("marketplace");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchResults, setSearchResults] = useState<OpenVsxExtension[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inspectingExtension, setInspectingExtension] = useState<OpenVsxExtension | null>(null);

  const installedExtensions = useExtensionsStore((s) => s.installedExtensions);
  const installingIds = useExtensionsStore((s) => s.installingExtensionIds);
  const extensionErrors = useExtensionsStore((s) => s.extensionErrors);
  const installExtension = useExtensionsStore((s) => s.installExtension);
  const uninstallExtension = useExtensionsStore((s) => s.uninstallExtension);
  const toggleExtension = useExtensionsStore((s) => s.toggleExtension);

  const installedList = useMemo(() => Object.values(installedExtensions), [installedExtensions]);

  const { theme: currentTheme, setTheme } = useTheme();

  // Trigger search on debounced query or category change
  useEffect(() => {
    if (activeTab !== "marketplace") return;

    if (!deferredQuery.trim() && !selectedCategory) {
      setSearchResults(POPULAR_EXTENSIONS);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const abortController = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    searchOpenVsxExtensions(deferredQuery, {
      category: selectedCategory || undefined,
      signal: abortController.signal,
    })
      .then((extensions) => {
        if (!abortController.signal.aborted) {
          setSearchResults(extensions);
          setIsSearching(false);
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setSearchError(err instanceof Error ? err.message : "Search failed");
          setIsSearching(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [deferredQuery, selectedCategory, activeTab]);

  const filteredInstalled = useMemo(() => {
    let list = installedList;
    if (deferredQuery.trim()) {
      const q = deferredQuery.toLowerCase();
      list = list.filter(
        (ext) =>
          ext.displayName.toLowerCase().includes(q) ||
          ext.name.toLowerCase().includes(q) ||
          ext.description.toLowerCase().includes(q) ||
          ext.namespace.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      list = list.filter((ext) => ext.categories.includes(selectedCategory));
    }
    return list;
  }, [installedList, deferredQuery, selectedCategory]);

  const handleInstall = useCallback(
    async (ext: OpenVsxExtension) => {
      await installExtension(ext);
    },
    [installExtension],
  );

  const handleUninstall = useCallback(
    async (id: string) => {
      await uninstallExtension(id);
    },
    [uninstallExtension],
  );

  return (
    <div className={cn("flex h-full w-full flex-col bg-background text-foreground", className)}>
      {/* Top Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Blocks className="size-4 text-primary" />
          <h2 className="text-xs font-semibold tracking-wide uppercase">Extensions</h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Close Extensions"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col gap-2 border-b border-border/80 p-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("marketplace")}
            className={cn(
              "cursor-pointer flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              activeTab === "marketplace"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Globe className="size-3.5" />
            Marketplace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("installed")}
            className={cn(
              "cursor-pointer flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              activeTab === "installed"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Check className="size-3.5" />
            Installed
            {installedList.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-0.5 px-1 py-0 text-[10px]">
                {installedList.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === "marketplace"
                ? "Search Open VSX (e.g. Python, Prettier, Tokyo Night)..."
                : "Filter installed extensions..."
            }
            className="h-8 pl-8 pr-7 text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="cursor-pointer absolute right-2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "" : cat.value)}
                className={cn(
                  "cursor-pointer whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-2.5">
          {activeTab === "marketplace" ? (
            <div>
              {/* Marketplace Header / Info */}
              {!query && !selectedCategory && (
                <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Popular on Open VSX</span>
                  </div>
                  <span>Registry: open-vsx.org</span>
                </div>
              )}

              {isSearching && (
                <div className="flex h-32 items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Searching Open VSX...</span>
                </div>
              )}

              {searchError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <p className="font-semibold">Search unavailable</p>
                  <p className="mt-0.5 opacity-90">{searchError}</p>
                </div>
              )}

              {!isSearching && !searchError && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                  <Blocks className="size-8 stroke-1 text-muted-foreground/50" />
                  <p className="mt-2 font-medium">No extensions found</p>
                  <p className="mt-1 text-[11px]">
                    Try searching for another term or clearing the category filter.
                  </p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="flex flex-col divide-y divide-border/40">
                  {searchResults.map((ext) => {
                    const installed = installedExtensions[ext.id];
                    const isInstalling = installingIds[ext.id] === true;
                    const error = extensionErrors[ext.id];

                    return (
                      <div
                        key={ext.id}
                        className="group flex flex-col gap-2 py-2.5 px-1.5 transition-colors hover:bg-muted/40 rounded-md"
                      >
                        <div className="flex items-start gap-3">
                          <ExtensionIcon iconUrl={ext.iconUrl} name={ext.name} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingExtension(ext)}
                                className="cursor-pointer truncate text-left text-xs font-medium hover:underline text-foreground"
                              >
                                {ext.displayName}
                              </button>
                              <span className="text-[10px] text-muted-foreground">
                                v{ext.version}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{ext.namespace}</span>
                              {ext.downloadCount > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Download className="size-2.5" />
                                  {formatDownloadCount(ext.downloadCount)}
                                </span>
                              )}
                              {ext.averageRating > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-500">
                                  <Star className="size-2.5 fill-current" />
                                  {ext.averageRating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/90">
                              {ext.description || "No description provided."}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="flex shrink-0 items-center gap-1">
                            {installed ? (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" size="sm" className="gap-1 font-normal">
                                  <Check className="size-3 text-emerald-500" />
                                  Installed
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUninstall(ext.id)}
                                  className="size-6 text-muted-foreground hover:text-destructive"
                                  aria-label="Uninstall extension"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isInstalling}
                                onClick={() => handleInstall(ext)}
                                className="h-6 gap-1 px-2.5 text-[11px]"
                              >
                                {isInstalling ? (
                                  <>
                                    <Loader2 className="size-3 animate-spin" />
                                    Installing
                                  </>
                                ) : (
                                  <>
                                    <Download className="size-3" />
                                    Install
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {error && (
                          <div className="rounded bg-destructive/10 px-2 py-1 text-[10px] text-destructive">
                            {error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Installed Tab */
            <div>
              {filteredInstalled.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                  <Check className="size-8 stroke-1 text-muted-foreground/50" />
                  <p className="mt-2 font-medium">No installed extensions</p>
                  <p className="mt-1 text-[11px]">
                    Browse the Marketplace to install languages, themes, and tools.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("marketplace")}
                    className="mt-3 h-7 text-xs"
                  >
                    Go to Marketplace
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/40">
                  {filteredInstalled.map((ext) => {
                    return (
                      <div
                        key={ext.id}
                        className={cn(
                          "group flex flex-col gap-2 py-2.5 px-1.5 transition-colors hover:bg-muted/40 rounded-md",
                          !ext.enabled && "opacity-60",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <ExtensionIcon iconUrl={ext.iconUrl} name={ext.name} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-medium text-foreground">
                                {ext.displayName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                v{ext.version}
                              </span>
                              {!ext.enabled && (
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  Disabled
                                </Badge>
                              )}
                              {ext.isTheme && (
                                <Badge variant="secondary" size="sm" className="text-[10px]">
                                  Theme
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{ext.namespace}</span>
                              <span>•</span>
                              <span>
                                Installed {new Date(ext.installedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/90">
                              {ext.description || "No description provided."}
                            </p>
                          </div>

                          {/* Installed Actions */}
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExtension(ext.id)}
                              className="h-6 px-2 text-[11px]"
                            >
                              {ext.enabled ? "Disable" : "Enable"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUninstall(ext.id)}
                              className="size-6 text-muted-foreground hover:text-destructive"
                              aria-label="Uninstall extension"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Theme application helper if theme */}
                        {ext.isTheme && ext.themeIds && ext.themeIds.length > 0 && (
                          <div className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1 text-[11px]">
                            <span className="text-muted-foreground">Contributed themes:</span>
                            {ext.themeIds.map((tid) => (
                              <Button
                                key={tid}
                                size="sm"
                                variant={currentTheme === tid ? "secondary" : "ghost"}
                                onClick={() => setTheme(tid)}
                                className="h-5 px-1.5 text-[10px]"
                              >
                                {tid}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Extension Inspection Dialog */}
      {inspectingExtension && (
        <Dialog open onOpenChange={() => setInspectingExtension(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <ExtensionIcon
                  iconUrl={inspectingExtension.iconUrl}
                  name={inspectingExtension.name}
                  className="size-12"
                />
                <div>
                  <DialogTitle className="text-sm font-semibold">
                    {inspectingExtension.displayName}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {inspectingExtension.namespace} • v{inspectingExtension.version}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <p className="text-muted-foreground">
                {inspectingExtension.description || "No description available."}
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Downloads:</span>{" "}
                  <span className="font-medium">
                    {formatDownloadCount(inspectingExtension.downloadCount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>{" "}
                  <span className="font-medium">
                    {inspectingExtension.averageRating > 0
                      ? `${inspectingExtension.averageRating.toFixed(1)} / 5.0`
                      : "Unrated"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">License:</span>{" "}
                  <span className="font-medium">
                    {inspectingExtension.license || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Categories:</span>{" "}
                  <span className="font-medium">
                    {inspectingExtension.categories.join(", ") || "General"}
                  </span>
                </div>
              </div>

              {/* External Links */}
              <div className="flex items-center gap-3 pt-1 text-[11px]">
                {inspectingExtension.homepageUrl && (
                  <a
                    href={inspectingExtension.homepageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Homepage
                  </a>
                )}
                {inspectingExtension.sourceUrl && (
                  <a
                    href={inspectingExtension.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Source Repository
                  </a>
                )}
                <a
                  href={`https://open-vsx.org/extension/${inspectingExtension.namespace}/${inspectingExtension.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Open VSX
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectingExtension(null)}>
                Close
              </Button>
              {installedExtensions[inspectingExtension.id] ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleUninstall(inspectingExtension.id);
                    setInspectingExtension(null);
                  }}
                >
                  Uninstall
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    handleInstall(inspectingExtension);
                    setInspectingExtension(null);
                  }}
                >
                  Install Extension
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
