import type { LanguageServerDiagnosticsEvent } from "@t3tools/contracts";
import { CircleAlertIcon, CircleXIcon } from "lucide-react";

import { countDiagnostics } from "./useLanguageServer";

/** Slim footer under the editor: hover info for the caret and the file's problem counts. */
export function LanguageStatusBar(props: {
  event: LanguageServerDiagnosticsEvent | null;
  hoverText: string | null;
}) {
  const { event } = props;
  if (event === null || event.type === "unsupported") return null;
  return (
    <div
      className="flex h-6 min-h-6 shrink-0 items-center gap-3 border-t border-border/60 px-3 text-xs text-muted-foreground"
      data-language-status
    >
      {event.type === "unavailable" ? (
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
