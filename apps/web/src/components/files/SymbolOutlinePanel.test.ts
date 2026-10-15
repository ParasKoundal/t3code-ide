import { describe, expect, it } from "vite-plus/test";
import type { DocumentSymbol } from "./symbolExtractor";

describe("SymbolOutlinePanel logic", () => {
  it("filters symbols by search query", () => {
    const symbols: DocumentSymbol[] = [
      { name: "handleOpen", kind: "function", line: 10 },
      { name: "handleClose", kind: "function", line: 20 },
      { name: "UserState", kind: "interface", line: 30 },
    ];

    const filter = "handle";
    const filtered = symbols.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()));
    expect(filtered.length).toBe(2);
    expect(filtered[0]?.name).toBe("handleOpen");
    expect(filtered[1]?.name).toBe("handleClose");
  });
});
