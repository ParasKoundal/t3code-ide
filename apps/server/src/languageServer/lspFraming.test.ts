import { describe, expect, it } from "vite-plus/test";

import { encodeLspMessage, LspMessageDecoder } from "./lspFraming.ts";

describe("LSP framing", () => {
  it("decodes messages split across chunks and batched in one chunk", () => {
    const first = encodeLspMessage({ id: 1, result: "héllo" });
    const second = encodeLspMessage({ method: "x", params: [1, 2] });
    const decoder = new LspMessageDecoder();
    expect(decoder.push(first.subarray(0, 7))).toEqual([]);
    expect(decoder.push(Buffer.concat([first.subarray(7), second]))).toEqual([
      { id: 1, result: "héllo" },
      { method: "x", params: [1, 2] },
    ]);
  });

  it("measures the body in bytes, not characters", () => {
    const encoded = encodeLspMessage({ text: "€" }).toString("utf8");
    expect(encoded.startsWith(`Content-Length: ${Buffer.byteLength('{"text":"€"}')}\r\n`)).toBe(
      true,
    );
  });

  it("skips a malformed body and keeps decoding", () => {
    const bad = Buffer.from("Content-Length: 3\r\n\r\n{x}", "ascii");
    const decoder = new LspMessageDecoder();
    expect(decoder.push(Buffer.concat([bad, encodeLspMessage({ ok: true })]))).toEqual([
      { ok: true },
    ]);
  });
});
