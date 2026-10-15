// @effect-diagnostics nodeBuiltinImport:off - a long-lived stdio JSON-RPC peer.
// @effect-diagnostics globalTimers:off - request timeouts belong to this promise-based peer; the
// Effect service owns server lifetimes.
import * as NodeChildProcess from "node:child_process";
import * as NodeURL from "node:url";

import { encodeLspMessage, LspMessageDecoder } from "./lspFraming.ts";

/** LSP `Diagnostic`, narrowed to the fields T3 Code renders. */
export interface LspDiagnostic {
  readonly range: {
    readonly start: { readonly line: number; readonly character: number };
    readonly end: { readonly line: number; readonly character: number };
  };
  readonly severity?: number;
  readonly message: string;
  readonly source?: string;
  readonly code?: string | number;
}

interface PendingRequest {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30_000;
const SHUTDOWN_GRACE_MS = 2_000;

/**
 * One language server process rooted at a project folder. It speaks just
 * enough of the protocol for whole-document sync, diagnostics, hover, and
 * definition, and answers the server's own requests with empty results.
 */
export class LspClient {
  readonly #process: NodeChildProcess.ChildProcess;
  readonly #decoder = new LspMessageDecoder();
  readonly #pending = new Map<number, PendingRequest>();
  #nextId = 1;
  #exited = false;
  readonly ready: Promise<void>;
  readonly handlers: {
    readonly onDiagnostics: (uri: string, diagnostics: readonly LspDiagnostic[]) => void;
    readonly onExit: (reason: string) => void;
  };

  constructor(
    input: {
      readonly command: string;
      readonly args: readonly string[];
      readonly rootPath: string;
      readonly env: NodeJS.ProcessEnv;
    },
    handlers: {
      readonly onDiagnostics: (uri: string, diagnostics: readonly LspDiagnostic[]) => void;
      readonly onExit: (reason: string) => void;
    },
  ) {
    this.handlers = handlers;
    this.#process = NodeChildProcess.spawn(input.command, [...input.args], {
      cwd: input.rootPath,
      stdio: ["pipe", "pipe", "pipe"],
      env: input.env,
      windowsHide: true,
    });
    this.#process.stdout?.on("data", (chunk: Buffer) => {
      for (const message of this.#decoder.push(chunk)) this.#handleMessage(message);
    });
    // Servers log to stderr; it is drained so a chatty server never blocks.
    this.#process.stderr?.resume();
    this.#process.on("error", (error) => this.#markExited(`failed to start: ${error.message}`));
    this.#process.on("exit", (code, signal) =>
      this.#markExited(`exited (${signal ?? code ?? "unknown"})`),
    );

    const rootUri = NodeURL.pathToFileURL(input.rootPath).href;
    this.ready = this.request("initialize", {
      processId: process.pid,
      clientInfo: { name: "T3 Code" },
      rootUri,
      rootPath: input.rootPath,
      workspaceFolders: [{ uri: rootUri, name: input.rootPath }],
      capabilities: {
        textDocument: {
          synchronization: { dynamicRegistration: false, didSave: false },
          publishDiagnostics: { relatedInformation: false },
          hover: { contentFormat: ["markdown", "plaintext"] },
          definition: { linkSupport: false },
        },
        workspace: { configuration: true, workspaceFolders: true },
        window: { workDoneProgress: false },
      },
      initializationOptions: {},
    }).then(() => this.notify("initialized", {}));
  }

  get exited(): boolean {
    return this.#exited;
  }

  request(method: string, params: unknown): Promise<unknown> {
    if (this.#exited) return Promise.reject(new Error("Language server is not running."));
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Language server did not answer ${method}.`));
      }, REQUEST_TIMEOUT_MS);
      this.#pending.set(id, { resolve, reject, timer });
      this.#write({ jsonrpc: "2.0", id, method, params });
    });
  }

  notify(method: string, params: unknown): void {
    if (!this.#exited) this.#write({ jsonrpc: "2.0", method, params });
  }

  /** Asks the server to exit, then kills it if it lingers. */
  async shutdown(): Promise<void> {
    if (this.#exited) return;
    const killTimer = setTimeout(() => this.#process.kill("SIGKILL"), SHUTDOWN_GRACE_MS);
    try {
      await Promise.race([
        this.request("shutdown", null),
        new Promise((resolve) => setTimeout(resolve, SHUTDOWN_GRACE_MS)),
      ]);
      this.notify("exit", null);
    } catch {
      this.#process.kill("SIGTERM");
    } finally {
      if (this.#exited) clearTimeout(killTimer);
    }
  }

  #write(message: unknown): void {
    this.#process.stdin?.write(encodeLspMessage(message));
  }

  #markExited(reason: string): void {
    if (this.#exited) return;
    this.#exited = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`Language server ${reason}.`));
    }
    this.#pending.clear();
    this.handlers.onExit(reason);
  }

  #handleMessage(message: unknown): void {
    if (typeof message !== "object" || message === null) return;
    const record = message as {
      id?: number | string;
      method?: string;
      params?: unknown;
      result?: unknown;
      error?: { message?: string };
    };
    if (record.method === undefined && typeof record.id === "number") {
      const pending = this.#pending.get(record.id);
      if (!pending) return;
      this.#pending.delete(record.id);
      clearTimeout(pending.timer);
      if (record.error) pending.reject(new Error(record.error.message ?? "Request failed."));
      else pending.resolve(record.result);
      return;
    }
    if (record.method === "textDocument/publishDiagnostics") {
      const params = record.params as { uri?: string; diagnostics?: LspDiagnostic[] };
      if (typeof params?.uri === "string" && Array.isArray(params.diagnostics)) {
        this.handlers.onDiagnostics(params.uri, params.diagnostics);
      }
      return;
    }
    if (record.method !== undefined && record.id !== undefined) {
      // Server-to-client requests: configuration gets one empty section per
      // item; everything else (progress tokens, registrations) gets null.
      const items = (record.params as { items?: unknown[] } | undefined)?.items;
      const result =
        record.method === "workspace/configuration" && Array.isArray(items)
          ? items.map(() => null)
          : null;
      this.#write({ jsonrpc: "2.0", id: record.id, result });
    }
  }
}
