import type { EnvironmentId } from "@t3tools/contracts";
import type { CSSProperties } from "react";

import { isElectron } from "~/env";
import { RESIZABLE_WIDTH_PROPERTY, useResizableWidth } from "~/hooks/useResizableWidth";
import { cn } from "~/lib/utils";
import { COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS } from "~/workspaceTitlebar";

import { RightPanelResizeHandle } from "../preview/RightPanelResizeHandle";
import FileBrowserPanel from "./FileBrowserPanel";

interface IdeExplorerProps {
  environmentId: EnvironmentId;
  cwd: string;
  projectName: string;
  selectedPath: string | null;
  selectedPathRevealId: number;
  onOpenFile: (relativePath: string) => void;
  workspaceMutationId: string | null;
  /** The explorer is the window's leftmost column and must clear the window controls. */
  leadingTitlebarInset: boolean;
}

/**
 * Persistent file explorer shown before the editor tabs in IDE layout. It
 * stays put while any tab is active, so files open as tabs beside it.
 */
export function IdeExplorer(props: IdeExplorerProps) {
  const { width, handlers } = useResizableWidth({
    storageKey: "t3code:ide-explorer-width",
    defaultWidth: 248,
    minWidth: 180,
    maxWidth: 480,
    edge: "right",
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
          {props.projectName}
        </span>
      </div>
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
      <RightPanelResizeHandle handlers={handlers} className="right-0 left-auto w-1.5" />
    </aside>
  );
}
