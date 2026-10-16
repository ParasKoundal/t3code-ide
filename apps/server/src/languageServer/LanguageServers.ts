// @effect-diagnostics nodeBuiltinImport:off - executable lookup and file URLs.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import {
  LanguageServerError,
  type LanguageServerDefinitionResult,
  type LanguageServerDiagnostic,
  type LanguageServerDiagnosticsEvent,
  type LanguageServerDocumentInput,
  type LanguageServerHoverResult,
  type LanguageServerPositionInput,
} from "@t3tools/contracts";
import * as HostProcess from "@t3tools/shared/HostProcess";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";

import * as WorkspacePaths from "../workspace/WorkspacePaths.ts";
import {
  type LanguageServerSpec,
  languageServerForPath,
  resolveLanguageServerCommand,
} from "./languageServerRegistry.ts";
import { LspClient, type LspDiagnostic } from "./lspClient.ts";

/** A server with no open documents stops after this long, so idle projects cost nothing. */
const IDLE_SHUTDOWN = Duration.minutes(3);
/** Files above this size are not sent to a language server. */
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

export class LanguageServers extends Context.Service<
  LanguageServers,
  {
    /**
     * Diagnostics for a file as saved on disk, refreshed when the file changes.
     * Opening the stream starts the matching language server for the folder;
     * closing the last stream for a server lets it stop when idle.
     */
    readonly diagnostics: (
      input: LanguageServerDocumentInput,
    ) => Stream.Stream<LanguageServerDiagnosticsEvent, LanguageServerError>;
    readonly hover: (
      input: LanguageServerPositionInput,
    ) => Effect.Effect<LanguageServerHoverResult, LanguageServerError>;
    readonly definition: (
      input: LanguageServerPositionInput,
    ) => Effect.Effect<LanguageServerDefinitionResult, LanguageServerError>;
  }
>()("t3/languageServer/LanguageServers") {}

interface OpenDocument {
  refCount: number;
  version: number;
  readonly languageId: string;
}

interface Session {
  readonly key: string;
  readonly spec: LanguageServerSpec;
  readonly client: LspClient;
  readonly documents: Map<string, OpenDocument>;
  readonly diagnosticsByUri: Map<string, readonly LanguageServerDiagnostic[]>;
  readonly listeners: Map<string, Set<(diagnostics: readonly LanguageServerDiagnostic[]) => void>>;
  readonly exitListeners: Set<(reason: string) => void>;
  idleShutdown: Fiber.Fiber<void> | null;
}

const SEVERITY: Record<number, LanguageServerDiagnostic["severity"]> = {
  1: "error",
  2: "warning",
  3: "info",
  4: "hint",
};

export function toLanguageServerDiagnostic(diagnostic: LspDiagnostic): LanguageServerDiagnostic {
  const clamp = (value: number) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
  const code = diagnostic.code === undefined ? "" : ` (${diagnostic.code})`;
  return {
    startLine: clamp(diagnostic.range.start.line),
    startCharacter: clamp(diagnostic.range.start.character),
    endLine: clamp(diagnostic.range.end.line),
    endCharacter: clamp(diagnostic.range.end.character),
    severity: SEVERITY[diagnostic.severity ?? 1] ?? "error",
    message: `${diagnostic.message}${code}`,
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
  };
}

/** Flattens LSP hover contents (string, MarkedString, MarkupContent, or arrays) to markdown. */
export function hoverContentsToMarkdown(contents: unknown): string | null {
  const part = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value !== "object" || value === null) return "";
    const record = value as { language?: string; value?: string; kind?: string };
    if (typeof record.value !== "string") return "";
    return record.language ? `\`\`\`${record.language}\n${record.value}\n\`\`\`` : record.value;
  };
  const text = (Array.isArray(contents) ? contents.map(part) : [part(contents)])
    .filter((value) => value.trim().length > 0)
    .join("\n\n")
    .trim();
  return text.length > 0 ? text : null;
}

function isExecutable(absolutePath: string): boolean {
  try {
    NodeFS.accessSync(absolutePath, NodeFS.constants.X_OK);
    return NodeFS.statSync(absolutePath).isFile();
  } catch {
    return false;
  }
}

const languageServerError = (message: string) => (cause: unknown) =>
  new LanguageServerError({ message, cause });

export const make = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const workspacePaths = yield* WorkspacePaths.WorkspacePaths;
  const sessions = new Map<string, Session>();
  const serviceScope = yield* Effect.scope;

  yield* Effect.addFinalizer(() =>
    Effect.promise(() =>
      Promise.all(
        [...sessions.values()].map((session) => session.client.shutdown().catch(() => undefined)),
      ),
    ),
  );

  const resolveDocument = (input: { cwd: string; relativePath: string }) =>
    workspacePaths
      .resolveRelativePathWithinRoot({ workspaceRoot: input.cwd, relativePath: input.relativePath })
      .pipe(
        Effect.mapError(
          (cause) =>
            new LanguageServerError({
              message: `'${input.relativePath}' is not inside the project folder.`,
              cause,
            }),
        ),
        Effect.map((target) => ({
          absolutePath: target.absolutePath,
          uri: NodeURL.pathToFileURL(target.absolutePath).href,
        })),
      );

  /** The running server for a folder, started on first use. Null when none is installed. */
  const acquireSession = (
    spec: LanguageServerSpec,
    rootPath: string,
    host: { readonly platform: NodeJS.Platform; readonly env: NodeJS.ProcessEnv },
  ): Session | null => {
    const key = `${spec.id}\u0000${rootPath}`;
    const existing = sessions.get(key);
    if (existing && !existing.client.exited) return existing;
    const isWindows = host.platform === "win32";
    const command = resolveLanguageServerCommand({
      spec,
      projectRoot: rootPath,
      pathDirectories: (host.env.PATH ?? "").split(NodePath.delimiter).filter(Boolean),
      pathSeparator: NodePath.sep,
      executableSuffixes: isWindows ? [".cmd", ".exe", ""] : [""],
      isExecutable,
    });
    if (command === null) return null;
    const session: Session = {
      key,
      spec,
      documents: new Map(),
      diagnosticsByUri: new Map(),
      listeners: new Map(),
      exitListeners: new Set(),
      idleShutdown: null,
      client: new LspClient(
        { command: command.command, args: command.args, rootPath, env: host.env },
        {
          onDiagnostics: (uri, diagnostics) => {
            const converted = diagnostics.map(toLanguageServerDiagnostic);
            session.diagnosticsByUri.set(uri, converted);
            for (const listener of session.listeners.get(uri) ?? []) listener(converted);
          },
          onExit: (reason) => {
            if (sessions.get(key) === session) sessions.delete(key);
            for (const listener of session.exitListeners) listener(reason);
          },
        },
      ),
    };
    sessions.set(key, session);
    return session;
  };

  const scheduleIdleShutdown = (session: Session) =>
    Effect.gen(function* () {
      if (session.documents.size > 0 || session.idleShutdown !== null) return;
      session.idleShutdown = yield* Effect.sleep(IDLE_SHUTDOWN).pipe(
        Effect.andThen(
          Effect.promise(async () => {
            session.idleShutdown = null;
            if (session.documents.size > 0) return;
            if (sessions.get(session.key) === session) sessions.delete(session.key);
            await session.client.shutdown().catch(() => undefined);
          }),
        ),
        Effect.forkIn(serviceScope),
      );
    });

  const readDocumentText = (absolutePath: string) =>
    fileSystem.stat(absolutePath).pipe(
      Effect.flatMap((stat) =>
        Number(stat.size) > MAX_DOCUMENT_BYTES
          ? Effect.succeed(null)
          : fileSystem.readFileString(absolutePath),
      ),
      Effect.orElseSucceed(() => null),
    );

  const diagnostics: LanguageServers["Service"]["diagnostics"] = (input) =>
    Stream.callback<LanguageServerDiagnosticsEvent, LanguageServerError>((queue) =>
      Effect.gen(function* () {
        const match = languageServerForPath(input.relativePath);
        if (match === null) {
          Queue.offerUnsafe(queue, { type: "unsupported" });
          Queue.endUnsafe(queue);
          return;
        }
        const { spec, languageId } = match;
        const document = yield* resolveDocument(input);
        const session = acquireSession(spec, input.cwd, {
          platform: yield* HostProcess.Platform,
          env: yield* HostProcess.Environment,
        });
        if (session === null) {
          Queue.offerUnsafe(queue, {
            type: "unavailable",
            serverName: spec.name,
            installHint: spec.installHint,
          });
          Queue.endUnsafe(queue);
          return;
        }
        if (session.idleShutdown !== null) {
          const pending = session.idleShutdown;
          session.idleShutdown = null;
          yield* Fiber.interrupt(pending);
        }

        const onDiagnostics = (next: readonly LanguageServerDiagnostic[]) =>
          Queue.offerUnsafe(queue, {
            type: "diagnostics",
            serverName: spec.name,
            diagnostics: next,
          });
        const onExit = (reason: string) => {
          Queue.offerUnsafe(queue, { type: "stopped", serverName: spec.name, reason });
          Queue.endUnsafe(queue);
        };
        const listeners = session.listeners.get(document.uri) ?? new Set();
        listeners.add(onDiagnostics);
        session.listeners.set(document.uri, listeners);
        session.exitListeners.add(onExit);

        let open = session.documents.get(document.uri);
        if (open) open.refCount += 1;
        else {
          open = { refCount: 1, version: 1, languageId };
          session.documents.set(document.uri, open);
        }
        const openDocument = open;

        yield* Effect.addFinalizer(() =>
          Effect.suspend(() => {
            listeners.delete(onDiagnostics);
            if (listeners.size === 0) session.listeners.delete(document.uri);
            session.exitListeners.delete(onExit);
            openDocument.refCount -= 1;
            if (openDocument.refCount > 0) return Effect.void;
            session.documents.delete(document.uri);
            session.diagnosticsByUri.delete(document.uri);
            session.client.notify("textDocument/didClose", {
              textDocument: { uri: document.uri },
            });
            return scheduleIdleShutdown(session);
          }),
        );

        const cached = session.diagnosticsByUri.get(document.uri);
        if (cached) onDiagnostics(cached);
        if (openDocument.refCount === 1) {
          yield* Effect.tryPromise({
            try: () => session.client.ready,
            catch: languageServerError(`${spec.name} language server failed to start.`),
          });
          const text = yield* readDocumentText(document.absolutePath);
          if (text !== null) {
            session.client.notify("textDocument/didOpen", {
              textDocument: { uri: document.uri, languageId, version: openDocument.version, text },
            });
          }
        }

        // Saves from the editor, the agent, or anything else resend the file.
        const fileName = NodePath.basename(document.absolutePath);
        const directory = NodePath.dirname(document.absolutePath);
        yield* fileSystem.watch(directory).pipe(
          Stream.filter(
            (event) =>
              event.path === fileName ||
              NodePath.resolve(directory, event.path) === document.absolutePath,
          ),
          Stream.debounce(Duration.millis(150)),
          Stream.runForEach(() =>
            readDocumentText(document.absolutePath).pipe(
              Effect.map((text) => {
                if (text === null || !session.documents.has(document.uri)) return;
                openDocument.version += 1;
                session.client.notify("textDocument/didChange", {
                  textDocument: { uri: document.uri, version: openDocument.version },
                  contentChanges: [{ text }],
                });
              }),
            ),
          ),
          Effect.ignoreCause({ log: true }),
          Effect.forkScoped,
        );
      }),
    );

  /** Runs a position request against the folder's server, which must already be running. */
  const positionRequest = <A>(
    input: LanguageServerPositionInput,
    method: string,
    decode: (result: unknown) => A,
    empty: A,
  ) =>
    Effect.gen(function* () {
      const match = languageServerForPath(input.relativePath);
      if (match === null) return empty;
      const document = yield* resolveDocument(input);
      const session = sessions.get(`${match.spec.id}\u0000${input.cwd}`);
      if (!session || session.client.exited) return empty;
      const result = yield* Effect.tryPromise({
        try: () =>
          session.client.request(method, {
            textDocument: { uri: document.uri },
            position: { line: input.line, character: input.character },
          }),
        catch: languageServerError(`${match.spec.name} could not answer the request.`),
      });
      return decode(result);
    });

  const hover: LanguageServers["Service"]["hover"] = (input) =>
    positionRequest(
      input,
      "textDocument/hover",
      (result) => ({
        contents:
          typeof result === "object" && result !== null && "contents" in result
            ? hoverContentsToMarkdown((result as { contents: unknown }).contents)
            : null,
      }),
      { contents: null },
    );

  const definition: LanguageServers["Service"]["definition"] = (input) =>
    positionRequest(
      input,
      "textDocument/definition",
      (result) => ({ locations: definitionLocations(result) }),
      { locations: [] },
    );

  return LanguageServers.of({ diagnostics, hover, definition });
});

/** Normalizes Location, Location[], and LocationLink[] to absolute file positions. */
export function definitionLocations(result: unknown): LanguageServerDefinitionResult["locations"] {
  const entries = Array.isArray(result) ? result : result ? [result] : [];
  return entries.flatMap((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as {
      uri?: string;
      range?: { start?: { line?: number; character?: number } };
      targetUri?: string;
      targetSelectionRange?: { start?: { line?: number; character?: number } };
    };
    const uri = record.targetUri ?? record.uri;
    const start = (record.targetSelectionRange ?? record.range)?.start;
    if (typeof uri !== "string" || !uri.startsWith("file:")) return [];
    try {
      return [
        {
          path: NodeURL.fileURLToPath(uri),
          line: Math.max(0, start?.line ?? 0),
          character: Math.max(0, start?.character ?? 0),
        },
      ];
    } catch {
      return [];
    }
  });
}

export const layer = Layer.effect(LanguageServers, make);
