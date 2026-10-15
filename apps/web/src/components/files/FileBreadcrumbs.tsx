import { RefreshIcon } from "~/components/ui/refresh-icon";
import { Spinner } from "~/components/ui/spinner";
import type { EnvironmentId } from "@t3tools/contracts";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PierreEntryIcon } from "~/components/chat/PierreEntryIcon";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "~/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { useTheme } from "~/hooks/useTheme";
import { useWorkspaceMutationRefresh } from "~/hooks/useWorkspaceMutationRefresh";
import { cn } from "~/lib/utils";
import { isAbsolutePath } from "@t3tools/shared/path";
import type { DocumentSymbol } from "./symbolExtractor";

import {
  type FileBreadcrumb,
  fileBreadcrumbChildren,
  fileBreadcrumbParent,
  fileBreadcrumbs,
} from "./filePath";
import { useProjectEntriesQuery } from "./projectFilesQueryState";

interface FileBreadcrumbsProps {
  readonly cwd: string;
  readonly environmentId: EnvironmentId;
  readonly onOpenFile: (relativePath: string) => void;
  readonly projectName: string;
  readonly relativePath: string;
  readonly workspaceMutationId: string | null;
  readonly symbols?: readonly DocumentSymbol[];
  readonly onSelectSymbol?: ((symbol: DocumentSymbol) => void) | undefined;
}

function pathLabel(path: string, projectName: string): string {
  return path.slice(path.lastIndexOf("/") + 1) || projectName;
}

function BreadcrumbLabel(props: {
  readonly current?: boolean;
  readonly label: string;
  readonly pathLabel: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "block max-w-40 truncate rounded-sm px-0.5",
              props.current ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          />
        }
      >
        {props.label}
      </TooltipTrigger>
      <TooltipPopup side="top">{props.pathLabel}</TooltipPopup>
    </Tooltip>
  );
}

function BreadcrumbMenuContent(props: {
  readonly cwd: string;
  readonly currentFilePath: string;
  readonly directoryPath: string;
  readonly environmentId: EnvironmentId;
  readonly onDirectoryChange: (path: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenFile: (path: string) => void;
  readonly projectName: string;
  readonly rootPath: string;
  readonly workspaceMutationId: string | null;
}) {
  const entriesQuery = useProjectEntriesQuery(props.environmentId, props.cwd, props.directoryPath);
  useWorkspaceMutationRefresh({
    mutationId: props.workspaceMutationId,
    refresh: entriesQuery.refresh,
    resourceKey: `files:${props.environmentId}:${props.cwd}`,
  });
  const { resolvedTheme } = useTheme();
  const entries = entriesQuery.data?.entries ?? [];
  const entriesTruncated = entriesQuery.data?.truncated ?? false;
  const children = useMemo(
    () => fileBreadcrumbChildren(entries, props.directoryPath),
    [entries, props.directoryPath],
  );
  const directoryAvailable = entriesQuery.data !== null;
  const parentPath = fileBreadcrumbParent(props.directoryPath);
  const canGoBack =
    props.directoryPath !== props.rootPath &&
    parentPath !== null &&
    (props.rootPath === "" ||
      parentPath === props.rootPath ||
      parentPath.startsWith(`${props.rootPath}/`));

  return (
    <MenuPopup
      align="start"
      side="bottom"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" || !canGoBack || parentPath === null) return;
        event.preventDefault();
        event.stopPropagation();
        props.onDirectoryChange(parentPath);
      }}
    >
      {canGoBack && parentPath !== null ? (
        <>
          <MenuItem closeOnClick={false} onClick={() => props.onDirectoryChange(parentPath)}>
            <ArrowLeftIcon />
            <span className="truncate">Back to {pathLabel(parentPath, props.projectName)}</span>
          </MenuItem>
          <MenuSeparator />
        </>
      ) : null}
      <MenuGroup key={props.directoryPath}>
        {entriesQuery.isPending && entriesQuery.data === null ? (
          <MenuItem disabled>
            <Spinner />
            Loading folder…
          </MenuItem>
        ) : entriesQuery.error && entriesQuery.data === null ? (
          <MenuItem closeOnClick={false} onClick={entriesQuery.refresh}>
            <RefreshIcon refreshing={entriesQuery.isPending} />
            <span className="min-w-0 flex-1 truncate">Retry loading folder</span>
          </MenuItem>
        ) : !directoryAvailable && !entriesTruncated ? (
          <MenuItem disabled>This folder is no longer available.</MenuItem>
        ) : children.length === 0 ? (
          <MenuItem disabled>
            {entriesTruncated
              ? "No entries from this folder are available in the partial workspace index."
              : "This folder is empty."}
          </MenuItem>
        ) : (
          // Files form a radio group keyed by path so the open file is marked as checked;
          // directories only navigate the menu, so they stay plain items.
          <MenuRadioGroup
            value={props.currentFilePath}
            onValueChange={(path) => {
              props.onOpenChange(false);
              props.onOpenFile(path);
            }}
          >
            {children.map((entry) => {
              const isCurrentFile = entry.kind === "file" && entry.path === props.currentFilePath;
              const row = (
                <>
                  <PierreEntryIcon pathValue={entry.path} kind={entry.kind} theme={resolvedTheme} />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            entry.ignored && "text-muted-foreground",
                          )}
                        />
                      }
                    >
                      {entry.label}
                    </TooltipTrigger>
                    <TooltipPopup side="right">{entry.path}</TooltipPopup>
                  </Tooltip>
                </>
              );
              return entry.kind === "directory" ? (
                <MenuItem
                  key={entry.path}
                  closeOnClick={false}
                  onClick={() => props.onDirectoryChange(entry.path)}
                >
                  {row}
                  <ChevronRightIcon />
                </MenuItem>
              ) : (
                <MenuRadioItem
                  key={entry.path}
                  value={entry.path}
                  closeOnClick
                  aria-current={isCurrentFile ? "page" : undefined}
                >
                  <span className="flex min-w-0 items-center gap-2">{row}</span>
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
        )}
      </MenuGroup>
      {entriesQuery.error && entriesQuery.data !== null ? (
        <>
          <MenuSeparator />
          <MenuItem closeOnClick={false} onClick={entriesQuery.refresh}>
            <RefreshIcon refreshing={entriesQuery.isPending} />
            Refresh failed — retry
          </MenuItem>
        </>
      ) : null}
      {entriesTruncated ? (
        <>
          <MenuSeparator />
          <MenuItem disabled>Some workspace entries are not shown.</MenuItem>
        </>
      ) : null}
    </MenuPopup>
  );
}

function DirectoryBreadcrumb(props: FileBreadcrumbsProps & { readonly crumb: FileBreadcrumb }) {
  const [open, setOpen] = useState(false);
  const [directoryPath, setDirectoryPath] = useState(props.crumb.path);

  useEffect(() => {
    setOpen(false);
    setDirectoryPath(props.crumb.path);
  }, [props.crumb.path, props.relativePath]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setDirectoryPath(props.crumb.path);
  };

  return (
    <Menu open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Browse ${props.crumb.label}`}
                  className="relative block max-w-40 cursor-pointer rounded-sm px-0.5 text-left text-muted-foreground outline-none pointer-coarse:after:-inset-y-3 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-popup-open:bg-accent data-popup-open:text-foreground"
                />
              }
            />
          }
        >
          <span className="block truncate">{props.crumb.label}</span>
        </TooltipTrigger>
        <TooltipPopup side="top">{props.crumb.path || props.projectName}</TooltipPopup>
      </Tooltip>
      {open ? (
        <BreadcrumbMenuContent
          cwd={props.cwd}
          currentFilePath={props.relativePath}
          directoryPath={directoryPath}
          environmentId={props.environmentId}
          onDirectoryChange={setDirectoryPath}
          onOpenChange={handleOpenChange}
          onOpenFile={props.onOpenFile}
          projectName={props.projectName}
          rootPath={props.crumb.path}
          workspaceMutationId={props.workspaceMutationId}
        />
      ) : null}
    </Menu>
  );
}

function SymbolBreadcrumb(props: {
  readonly symbols: readonly DocumentSymbol[];
  readonly onSelectSymbol?: ((symbol: DocumentSymbol) => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<DocumentSymbol | null>(
    props.symbols[0] ?? null,
  );

  if (props.symbols.length === 0) return null;

  const current = selectedSymbol ?? props.symbols[0]!;

  return (
    <div className="flex min-w-0 shrink-0 items-center">
      <ChevronRightIcon className="mx-1 size-3.5 shrink-0 text-muted-foreground/60" />
      <Menu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <MenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Select symbol: ${current.name}`}
                    className="relative flex max-w-48 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-left text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-popup-open:bg-accent data-popup-open:text-foreground font-mono text-[11px]"
                  />
                }
              />
            }
          >
            <span className="truncate">{current.name}</span>
          </TooltipTrigger>
          <TooltipPopup side="top">
            {current.kind}: {current.name} (line {current.line})
          </TooltipPopup>
        </Tooltip>
        {open ? (
          <MenuPopup align="start" side="bottom" className="max-h-60 overflow-y-auto">
            <MenuGroup>
              <MenuRadioGroup
                value={String(current.line)}
                onValueChange={(lineStr) => {
                  const sym = props.symbols.find((s) => String(s.line) === lineStr);
                  if (sym) {
                    setSelectedSymbol(sym);
                    props.onSelectSymbol?.(sym);
                  }
                  setOpen(false);
                }}
              >
                {props.symbols.map((sym) => (
                  <MenuRadioItem
                    key={`${sym.name}:${sym.line}`}
                    value={String(sym.line)}
                    closeOnClick
                  >
                    <span className="flex min-w-0 items-center justify-between gap-2 w-full">
                      <span className="truncate font-mono text-xs">{sym.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        :{sym.line}
                      </span>
                    </span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
          </MenuPopup>
        ) : null}
      </Menu>
    </div>
  );
}

export function FileBreadcrumbs(props: FileBreadcrumbsProps) {
  const hostPath = isAbsolutePath(props.relativePath);
  const breadcrumbs = useMemo(
    () => fileBreadcrumbs(props.projectName, props.relativePath),
    [props.projectName, props.relativePath],
  );

  return (
    <>
      {breadcrumbs.map((crumb, index) => (
        <div
          key={crumb.path || "project"}
          className="flex min-w-0 shrink-0 items-center"
          data-current-file-crumb={crumb.kind === "file"}
        >
          {index > 0 ? (
            <ChevronRightIcon className="mx-1 size-3.5 shrink-0 text-muted-foreground/60" />
          ) : null}
          {crumb.kind === "file" ? (
            <span aria-current="page">
              <BreadcrumbLabel current label={crumb.label} pathLabel={crumb.path} />
            </span>
          ) : hostPath ? (
            <BreadcrumbLabel label={crumb.label} pathLabel={crumb.path} />
          ) : (
            <DirectoryBreadcrumb {...props} crumb={crumb} />
          )}
        </div>
      ))}
      {props.symbols && props.symbols.length > 0 ? (
        <SymbolBreadcrumb symbols={props.symbols} onSelectSymbol={props.onSelectSymbol} />
      ) : null}
    </>
  );
}
