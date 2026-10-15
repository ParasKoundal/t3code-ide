import type { EnvironmentId } from "@t3tools/contracts";
import {
  isAbsolutePath,
  resolveWorkspaceFilePath,
  workspaceRelativeFilePath,
} from "@t3tools/shared/path";
import { ChevronRightIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";

import { isElectron } from "~/env";
import { RESIZABLE_WIDTH_PROPERTY, useResizableWidth } from "~/hooks/useResizableWidth";
import { cn } from "~/lib/utils";
import { COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS } from "~/workspaceTitlebar";

import { RightPanelResizeHandle } from "../preview/RightPanelResizeHandle";
import FileBrowserPanel from "./FileBrowserPanel";
import type { WorkspaceRoot } from "./workspaceRoots";

interface IdeExplorerProps {
  environmentId: EnvironmentId;
  cwd: string;
  projectName: string;
  /** Set when the sidebar is scoped to a workspace that includes this thread's project. */
  workspaceName: string | null;
  /** The workspace's other project folders on this thread's machine. */
  extraRoots: readonly WorkspaceRoot[];
  /** Path of the open file: relative to `cwd`, or absolute for a file in another root. */
  selectedPath: string | null;
  selectedPathRevealId: number;
  onOpenFile: (path: string) => void;
  workspaceMutationId: string | null;
  /** The explorer is the window's leftmost column and must clear the window controls. */
  leadingTitlebarInset: boolean;
}

/**
 * Persistent file explorer shown before the editor tabs in IDE layout. It
 * stays put while any tab is active, so files open as tabs beside it. In a
 * workspace it lists each project folder as its own collapsible section.
 */
export function IdeExplorer(props: IdeExplorerProps) {
  const { width, handlers } = useResizableWidth({
    storageKey: "t3code:ide-explorer-width",
    defaultWidth: 248,
    minWidth: 180,
    maxWidth: 480,
    edge: "right",
  });
  const [collapsedRoots, setCollapsedRoots] = useState<ReadonlySet<string>>(() => new Set());
  const multiRoot = props.extraRoots.length > 0;
  const roots: readonly WorkspaceRoot[] = [
    { cwd: props.cwd, title: props.projectName },
    ...props.extraRoots,
  ];
  const toggleRoot = (cwd: string) =>
    setCollapsedRoots((current) => {
      const next = new Set(current);
      if (next.has(cwd)) next.delete(cwd);
      else next.add(cwd);
      return next;
    });

  return (
    <aside
      aria-label="Explorer"
      className="relative flex min-h-0 shrink-0 flex-col border-r border-border/60 bg-background"
      style={
        {
          [RESIZABLE_WIDTH_PROPERTY]: `${width}px`,
          width: `var(${RESIZABLE_WIDTH_PROPERTY})`,
        } as CSSProperties
      }
      data-ide-explorer
    >
      <div
        className={cn(
          "flex h-[var(--workspace-topbar-height)] min-h-[var(--workspace-topbar-height)] shrink-0 items-center px-3",
          isElectron && "drag-region",
          props.leadingTitlebarInset && COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS,
        )}
      >
        <span className="truncate text-xs font-medium text-muted-foreground">
          {multiRoot && props.workspaceName ? props.workspaceName : props.projectName}
        </span>
      </div>
      {multiRoot ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {roots.map((root, index) => {
            const primary = index === 0;
            const collapsed = collapsedRoots.has(root.cwd);
            const selectedPath =
              props.selectedPath === null
                ? null
                : primary
                  ? isAbsolutePath(props.selectedPath)
                    ? null
                    : props.selectedPath
                  : workspaceRelativeFilePath(props.selectedPath, root.cwd);
            return (
              <section
                key={root.cwd}
                className={cn(
                  "flex min-h-0 flex-col border-t border-border/40 first:border-t-0",
                  !collapsed && "flex-1",
                )}
              >
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  className="flex h-7 shrink-0 cursor-pointer items-center gap-1 px-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => toggleRoot(root.cwd)}
                >
                  <ChevronRightIcon
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-150",
                      !collapsed && "rotate-90",
                    )}
                  />
                  <span className="truncate">{root.title}</span>
                </button>
                {collapsed ? null : (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <FileBrowserPanel
                      key={`${props.environmentId}:${root.cwd}`}
                      environmentId={props.environmentId}
                      cwd={root.cwd}
                      projectName={root.title}
                      selectedPath={selectedPath === "." ? null : selectedPath}
                      selectedPathRevealId={props.selectedPathRevealId}
                      onOpenFile={(relativePath) =>
                        props.onOpenFile(
                          primary ? relativePath : resolveWorkspaceFilePath(relativePath, root.cwd),
                        )
                      }
                      workspaceMutationId={props.workspaceMutationId}
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <FileBrowserPanel
            key={`${props.environmentId}:${props.cwd}`}
            environmentId={props.environmentId}
            cwd={props.cwd}
            projectName={props.projectName}
            selectedPath={props.selectedPath}
            selectedPathRevealId={props.selectedPathRevealId}
            onOpenFile={props.onOpenFile}
            workspaceMutationId={props.workspaceMutationId}
          />
        </div>
      )}
      <RightPanelResizeHandle handlers={handlers} className="right-0 left-auto w-1.5" />
    </aside>
  );
}
