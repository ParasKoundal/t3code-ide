import type { LanguageServerDiagnosticsEvent } from "@t3tools/contracts";
import { CircleAlertIcon, CircleXIcon, GitBranchIcon } from "lucide-react";

import { countDiagnostics } from "./useLanguageServer";

export interface FileGitDiffInfo {
  readonly status: "modified" | "added" | "deleted" | "untracked";
  readonly insertions: number;
  readonly deletions: number;
}

/** Slim footer under the editor: hover info for the caret, problem counts, and Git diff. */
export function LanguageStatusBar(props: {
  event: LanguageServerDiagnosticsEvent | null;
  hoverText: string | null;
  gitDiff?: FileGitDiffInfo | null;
}) {
  const { event, gitDiff } = props;
  const hasLsp = event !== null && event.type !== "unsupported";

  if (!hasLsp && !gitDiff) return null;

  return (
    <div
      className="flex h-6 min-h-6 shrink-0 items-center gap-3 border-t border-border/60 px-3 text-xs text-muted-foreground"
      data-language-status
    >
      {gitDiff ? (
        <span
          className="flex shrink-0 items-center gap-1.5 font-mono text-[11px]"
          title={`Git status: ${gitDiff.status}`}
        >
          <GitBranchIcon className="size-3 text-muted-foreground" />
          <span className="text-emerald-600 dark:text-emerald-400">+{gitDiff.insertions}</span>
          <span className="text-rose-600 dark:text-rose-400">-{gitDiff.deletions}</span>
        </span>
      ) : null}

      {!hasLsp ? null : event.type === "unavailable" ? (
        <span className="min-w-0 truncate">
          {event.serverName} language features: install with{" "}
          <code className="font-mono select-all">{event.installHint}</code>
        </span>
      ) : event.type === "stopped" ? (
        <span className="min-w-0 truncate">
          {event.serverName} language server {event.reason}. Reopen the file to restart it.
        </span>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate font-mono">{props.hoverText ?? ""}</span>
          <DiagnosticCounts diagnostics={event.diagnostics} />
          <span className="shrink-0">{event.serverName}</span>
        </>
      )}
    </div>
  );
}

function DiagnosticCounts(props: {
  diagnostics: Extract<LanguageServerDiagnosticsEvent, { type: "diagnostics" }>["diagnostics"];
}) {
  const { errors, warnings } = countDiagnostics(props.diagnostics);
  if (errors === 0 && warnings === 0) return <span className="shrink-0">No problems</span>;
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex items-center gap-1" aria-label={`${errors} errors`}>
        <CircleXIcon className="size-3.5 text-destructive-foreground" />
        {errors}
      </span>
      <span className="flex items-center gap-1" aria-label={`${warnings} warnings`}>
        <CircleAlertIcon className="size-3.5 text-warning-foreground" />
        {warnings}
      </span>
    </span>
  );
}
