import { describe, expect, it } from "vite-plus/test";

describe("InlineCodeEdit logic", () => {
  it("computes line range correctly", () => {
    const code = "const a = 1;\nconst b = 2;\nconst c = 3;\n";
    const lines = code.split("\n");
    const range = { start: 2, end: 3 };
    const snippet = lines.slice(range.start - 1, range.end).join("\n");
    expect(snippet).toBe("const b = 2;\nconst c = 3;");
  });

  it("splices replacement into lines correctly", () => {
    const code = "line1\nline2\nline3\nline4";
    const lines = code.split("\n");
    const startLine = 2;
    const endLine = 3;
    const replacement = "new_line2\nnew_line3";
    lines.splice(startLine - 1, endLine - startLine + 1, replacement);
    expect(lines.join("\n")).toBe("line1\nnew_line2\nnew_line3\nline4");
  });
});
