import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type {
  EnvironmentId,
  LanguageServerDiagnostic,
  LanguageServerDiagnosticsEvent,
  ScopedThreadRef,
} from "@t3tools/contracts";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

import { useRightPanelStore } from "~/rightPanelStore";
import {
  languageServerDefinition,
  languageServerDiagnostics,
  languageServerHover,
} from "~/state/projects";
import { useAtomCommand } from "~/state/use-atom-command";

/** The editor's marker shape: an LSP range plus severity and message. */
export interface EditorDiagnosticMarker {
  start: { line: number; character: number };
  end: { line: number; character: number };
  severity: LanguageServerDiagnostic["severity"];
  message: string;
  source?: string;
}

export function diagnosticMarkers(
  diagnostics: readonly LanguageServerDiagnostic[],
): EditorDiagnosticMarker[] {
  return diagnostics.map((diagnostic) => ({
    start: { line: diagnostic.startLine, character: diagnostic.startCharacter },
    end: { line: diagnostic.endLine, character: diagnostic.endCharacter },
    severity: diagnostic.severity,
    message: diagnostic.message,
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
  }));
}

export function countDiagnostics(diagnostics: readonly LanguageServerDiagnostic[]) {
  let errors = 0;
  let warnings = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") errors += 1;
    else if (diagnostic.severity === "warning") warnings += 1;
  }
  return { errors, warnings };
}

/** First meaningful line of hover markdown, without code fences, for the status bar. */
export function hoverSummary(markdown: string | null): string | null {
  if (markdown === null) return null;
  const line = markdown
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0 && !entry.startsWith("```"));
  return line ? line.replace(/^#+\s*/, "").slice(0, 240) : null;
}

interface EditorPositionSource {
  getViewState(): {
    selections?: ReadonlyArray<{ start: { line: number; character: number } }>;
  };
}

/**
 * Language intelligence for one editable file: the latest diagnostics event,
 * hover text for the caret after it rests, and F12 or Cmd/Ctrl+click to jump to
 * a definition. The server reads the saved file, so positions match once the
 * editor's autosave lands.
 */
export function useLanguageServer<TEditor extends EditorPositionSource>(input: {
  environmentId: EnvironmentId;
  cwd: string;
  relativePath: string;
  threadRef: ScopedThreadRef;
  editorRef: RefObject<TEditor | null>;
  surfaceRef: RefObject<HTMLElement | null>;
}) {
  const { environmentId, cwd, relativePath, threadRef, editorRef, surfaceRef } = input;
  const result = useAtomValue(
    languageServerDiagnostics({ environmentId, input: { cwd, relativePath } }),
  );
  const event: LanguageServerDiagnosticsEvent | null = AsyncResult.isSuccess(result)
    ? result.value
    : null;
  const diagnostics = event?.type === "diagnostics" ? event.diagnostics : EMPTY_DIAGNOSTICS;
  const markers = useMemo(() => diagnosticMarkers(diagnostics), [diagnostics]);

  const hover = useAtomCommand(languageServerHover, { reportFailure: false });
  const definition = useAtomCommand(languageServerDefinition, { reportFailure: false });
  const [hoverText, setHoverText] = useState<string | null>(null);
  const hoverRequestRef = useRef(0);
  const ready = event?.type === "diagnostics";

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const caret = () => editorRef.current?.getViewState().selections?.[0]?.start ?? null;
    const requestHover = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const position = caret();
        if (!position) return;
        const requestId = ++hoverRequestRef.current;
        void hover({ environmentId, input: { cwd, relativePath, ...position } }).then((outcome) => {
          if (requestId !== hoverRequestRef.current) return;
          setHoverText(outcome._tag === "Success" ? hoverSummary(outcome.value.contents) : null);
        });
      }, 450);
    };
    const goToDefinition = () => {
      const position = caret();
      if (!position) return;
      void definition({ environmentId, input: { cwd, relativePath, ...position } }).then(
        (outcome) => {
          const target = outcome._tag === "Success" ? outcome.value.locations[0] : undefined;
          if (!target) return;
          useRightPanelStore.getState().openFile(threadRef, target.path, target.line + 1);
        },
      );
    };
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "F12") {
        keyEvent.preventDefault();
        goToDefinition();
        return;
      }
      if (keyEvent.key.startsWith("Arrow") || keyEvent.key === "Home" || keyEvent.key === "End") {
        requestHover();
      }
    };
    const onMouseUp = (mouseEvent: MouseEvent) => {
      // The click has placed the caret by the time mouseup is handled.
      if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
        queueMicrotask(goToDefinition);
        return;
      }
      requestHover();
    };
    surface.addEventListener("keydown", onKeyDown, true);
    surface.addEventListener("mouseup", onMouseUp);
    return () => {
      clearTimeout(timer);
      surface.removeEventListener("keydown", onKeyDown, true);
      surface.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    cwd,
    definition,
    editorRef,
    environmentId,
    hover,
    ready,
    relativePath,
    surfaceRef,
    threadRef,
  ]);

  return { event, diagnostics, markers, hoverText: ready ? hoverText : null };
}

const EMPTY_DIAGNOSTICS: readonly LanguageServerDiagnostic[] = [];
