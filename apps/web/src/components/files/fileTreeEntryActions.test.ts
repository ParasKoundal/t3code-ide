import { describe, expect, it } from "vite-plus/test";

import {
  entryBaseName,
  entryParentDirectory,
  joinEntryPath,
  renamedEntryPath,
  validateEntryName,
} from "./fileTreeEntryActions";

describe("explorer entry paths", () => {
  it("creates beside a file and inside a folder", () => {
    expect(entryParentDirectory("src/app.ts", "file")).toBe("src");
    expect(entryParentDirectory("README.md", "file")).toBe("");
    expect(entryParentDirectory("src/lib/", "directory")).toBe("src/lib");
    expect(joinEntryPath("", "index.ts")).toBe("index.ts");
    expect(joinEntryPath("src", "nested\\util.ts")).toBe("src/nested/util.ts");
  });

  it("renames within the entry's own folder", () => {
    expect(entryBaseName("src/lib/")).toBe("lib");
    expect(renamedEntryPath("src/lib/", "core")).toBe("src/core");
    expect(renamedEntryPath("src/app.ts", "main.ts")).toBe("src/main.ts");
  });

  it("rejects names that escape or are empty", () => {
    expect(validateEntryName("ok/name.ts")).toBeNull();
    for (const name of ["", "  ", "/etc/passwd", "C:\\x", "../up", "a//b", "a/./b"]) {
      expect(validateEntryName(name)).not.toBeNull();
    }
  });
});
