/**
 * Language Server Protocol base framing: each JSON-RPC message is preceded by
 * a `Content-Length` header and a blank line.
 */

export function encodeLspMessage(message: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii"), body]);
}

const HEADER_TERMINATOR = Buffer.from("\r\n\r\n", "ascii");

/** Incremental decoder for a language server's stdout. */
export class LspMessageDecoder {
  #buffer: Buffer = Buffer.alloc(0);

  /** Appends a chunk and returns every message it completes. */
  push(chunk: Buffer): unknown[] {
    this.#buffer = this.#buffer.length === 0 ? chunk : Buffer.concat([this.#buffer, chunk]);
    const messages: unknown[] = [];
    for (;;) {
      const headerEnd = this.#buffer.indexOf(HEADER_TERMINATOR);
      if (headerEnd === -1) break;
      const header = this.#buffer.subarray(0, headerEnd).toString("ascii");
      const match = /content-length:\s*(\d+)/i.exec(header);
      if (!match) {
        // Not a frame we understand; drop the header and resynchronize.
        this.#buffer = this.#buffer.subarray(headerEnd + HEADER_TERMINATOR.length);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + HEADER_TERMINATOR.length;
      if (this.#buffer.length < bodyStart + length) break;
      const body = this.#buffer.subarray(bodyStart, bodyStart + length).toString("utf8");
      this.#buffer = this.#buffer.subarray(bodyStart + length);
      try {
        messages.push(JSON.parse(body));
      } catch {
        // A malformed body is skipped; the next frame still decodes.
      }
    }
    return messages;
  }
}
