import { describe, expect, it } from "vite-plus/test";

import { countDiagnostics, diagnosticMarkers, hoverSummary } from "./useLanguageServer";

const diagnostic = (severity: "error" | "warning" | "info" | "hint") => ({
  startLine: 1,
  startCharacter: 2,
  endLine: 1,
  endCharacter: 5,
  severity,
  message: `${severity} here`,
});

describe("language server presentation", () => {
  it("maps diagnostics to editor marker ranges", () => {
    expect(diagnosticMarkers([{ ...diagnostic("error"), source: "ts" }])).toEqual([
      {
        start: { line: 1, character: 2 },
        end: { line: 1, character: 5 },
        severity: "error",
        message: "error here",
        source: "ts",
      },
    ]);
  });

  it("counts only errors and warnings as problems", () => {
    expect(
      countDiagnostics([
        diagnostic("error"),
        diagnostic("warning"),
        diagnostic("warning"),
        diagnostic("hint"),
      ]),
    ).toEqual({ errors: 1, warnings: 2 });
  });

  it("summarizes hover markdown as its first content line", () => {
    expect(hoverSummary("```ts\nconst total: number\n```\n\nThe sum.")).toBe("const total: number");
    expect(hoverSummary("## Heading\nbody")).toBe("Heading");
    expect(hoverSummary(null)).toBeNull();
  });
});
