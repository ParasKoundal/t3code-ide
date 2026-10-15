import { describe, expect, it } from "vite-plus/test";
import { buildGitStatusMap, getDirectoryGitChangeCount } from "./gitStatusDecorations";

describe("gitStatusDecorations", () => {
  it("builds status map with correct added/modified/deleted tags", () => {
    const map = buildGitStatusMap([
      { path: "src/new.ts" as any, insertions: 10, deletions: 0 },
      { path: "src/removed.ts" as any, insertions: 0, deletions: 5 },
      { path: "src/changed.ts" as any, insertions: 4, deletions: 2 },
    ]);

    expect(map.get("src/new.ts")?.status).toBe("added");
    expect(map.get("src/removed.ts")?.status).toBe("deleted");
    expect(map.get("src/changed.ts")?.status).toBe("modified");
    expect(map.get("src/changed.ts")?.insertions).toBe(4);
  });

  it("calculates directory change counts correctly", () => {
    const map = buildGitStatusMap([
      { path: "apps/web/src/a.ts" as any, insertions: 1, deletions: 0 },
      { path: "apps/web/src/b.ts" as any, insertions: 1, deletions: 0 },
      { path: "apps/server/src/c.ts" as any, insertions: 1, deletions: 0 },
    ]);

    expect(getDirectoryGitChangeCount(map, "apps/web")).toBe(2);
    expect(getDirectoryGitChangeCount(map, "apps/server")).toBe(1);
    expect(getDirectoryGitChangeCount(map, "packages")).toBe(0);
  });
});
