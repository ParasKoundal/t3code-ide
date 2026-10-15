import * as NodeServices from "@effect/platform-node/NodeServices";
import { describe, expect, it } from "@effect/vitest";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Stream from "effect/Stream";

import * as WorkspacePaths from "../workspace/WorkspacePaths.ts";
import * as LanguageServers from "./LanguageServers.ts";

// A minimal language server: it reports one warning whose message carries the
// document's text, and answers hover with the hovered line.
const FAKE_SERVER = `#!/usr/bin/env node
let buffer = Buffer.alloc(0);
const send = (message) => {
  const body = Buffer.from(JSON.stringify(message));
  process.stdout.write("Content-Length: " + body.length + "\\r\\n\\r\\n");
  process.stdout.write(body);
};
const publish = (uri, text) =>
  send({ jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params: { uri, diagnostics: [
    { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, severity: 2, message: "text:" + text, source: "fake", code: 7 },
  ] } });
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const end = buffer.indexOf("\\r\\n\\r\\n");
    if (end === -1) return;
    const length = Number(/Content-Length: (\\d+)/.exec(buffer.subarray(0, end).toString())[1]);
    if (buffer.length < end + 4 + length) return;
    const message = JSON.parse(buffer.subarray(end + 4, end + 4 + length).toString());
    buffer = buffer.subarray(end + 4 + length);
    if (message.method === "initialize") send({ jsonrpc: "2.0", id: message.id, result: { capabilities: {} } });
    else if (message.method === "textDocument/didOpen") publish(message.params.textDocument.uri, message.params.textDocument.text);
    else if (message.method === "textDocument/didChange") publish(message.params.textDocument.uri, message.params.contentChanges[0].text);
    else if (message.method === "textDocument/hover") send({ jsonrpc: "2.0", id: message.id, result: { contents: { kind: "markdown", value: "line " + message.params.position.line } } });
    else if (message.method === "shutdown") send({ jsonrpc: "2.0", id: message.id, result: null });
    else if (message.method === "exit") process.exit(0);
  }
});
`;

const layerTest = LanguageServers.layer.pipe(
  Layer.provideMerge(WorkspacePaths.layer),
  Layer.provideMerge(NodeServices.layer),
);

const makeProject = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "t3code-lsp-" });
  const bin = path.join(cwd, "node_modules", ".bin");
  yield* fs.makeDirectory(bin, { recursive: true });
  const server = path.join(bin, "typescript-language-server");
  yield* fs.writeFileString(server, FAKE_SERVER);
  yield* fs.chmod(server, 0o755);
  yield* fs.writeFileString(path.join(cwd, "index.ts"), "one");
  return cwd;
});

it.layer(layerTest, { excludeTestServices: true })("LanguageServers", (it) => {
  describe("diagnostics", () => {
    it.effect("reports a file's diagnostics and refreshes them when it changes on disk", () =>
      Effect.gen(function* () {
        const service = yield* LanguageServers.LanguageServers;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const cwd = yield* makeProject;
        const first = yield* Deferred.make<void>();
        const events = yield* service.diagnostics({ cwd, relativePath: "index.ts" }).pipe(
          Stream.tap(() => Deferred.succeed(first, undefined)),
          Stream.take(2),
          Stream.runCollect,
          Effect.forkScoped,
        );
        yield* Deferred.await(first);
        const hover = yield* service.hover({
          cwd,
          relativePath: "index.ts",
          line: 4,
          character: 1,
        });
        yield* fs.writeFileString(path.join(cwd, "index.ts"), "two");
        const collected = yield* Fiber.join(events);

        expect(hover).toEqual({ contents: "line 4" });
        expect(collected).toEqual([
          {
            type: "diagnostics",
            serverName: "TypeScript",
            diagnostics: [
              {
                startLine: 0,
                startCharacter: 0,
                endLine: 0,
                endCharacter: 3,
                severity: "warning",
                message: "text:one (7)",
                source: "fake",
              },
            ],
          },
          expect.objectContaining({
            diagnostics: [expect.objectContaining({ message: "text:two (7)" })],
          }),
        ]);
      }),
    );

    it.effect("says when no language server handles the file type", () =>
      Effect.gen(function* () {
        const service = yield* LanguageServers.LanguageServers;
        const cwd = yield* makeProject;
        const events = yield* service
          .diagnostics({ cwd, relativePath: "notes.md" })
          .pipe(Stream.runCollect);
        expect(events).toEqual([{ type: "unsupported" }]);
      }),
    );

    it.effect("refuses paths outside the project folder", () =>
      Effect.gen(function* () {
        const service = yield* LanguageServers.LanguageServers;
        const cwd = yield* makeProject;
        const error = yield* service
          .diagnostics({ cwd, relativePath: "../escape.ts" })
          .pipe(Stream.runCollect, Effect.flip);
        expect(error._tag).toBe("LanguageServerError");
      }),
    );
  });
});

describe("LanguageServers helpers", () => {
  it("normalizes hover contents and definition shapes", () => {
    expect(
      LanguageServers.hoverContentsToMarkdown([
        { language: "ts", value: "const x: number" },
        "docs",
      ]),
    ).toBe("```ts\nconst x: number\n```\n\ndocs");
    expect(LanguageServers.hoverContentsToMarkdown({ kind: "markdown", value: "  " })).toBeNull();
    expect(
      LanguageServers.definitionLocations([
        {
          targetUri: "file:///repo/a.ts",
          targetSelectionRange: { start: { line: 3, character: 2 } },
        },
        { uri: "https://example.com", range: { start: { line: 0, character: 0 } } },
      ]),
    ).toEqual([{ path: "/repo/a.ts", line: 3, character: 2 }]);
  });
});
