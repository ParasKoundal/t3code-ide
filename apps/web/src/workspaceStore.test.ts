import { describe, expect, it } from "vite-plus/test";

import { resolveSidebarProjectScopeKey } from "./sidebarProjectGrouping";
import {
  normalizeWorkspaceInput,
  parseWorkspaceScopeKey,
  workspaceScopeKey,
} from "./workspaceStore";

describe("workspace scope keys", () => {
  it("round-trips a workspace id and ignores project keys", () => {
    expect(parseWorkspaceScopeKey(workspaceScopeKey("abc"))).toBe("abc");
    expect(parseWorkspaceScopeKey("env:project")).toBeNull();
    expect(parseWorkspaceScopeKey(null)).toBeNull();
  });

  it("keeps a workspace scope only while the workspace exists", () => {
    const key = workspaceScopeKey("w1");
    expect(resolveSidebarProjectScopeKey({ groups: [], key, workspaceIds: new Set(["w1"]) })).toBe(
      key,
    );
    // Deleting the workspace clears the scope even before project snapshots load.
    expect(resolveSidebarProjectScopeKey({ groups: [], key, workspaceIds: new Set() })).toBeNull();
  });
});

describe("normalizeWorkspaceInput", () => {
  it("collapses whitespace and removes duplicate or malformed members", () => {
    expect(
      normalizeWorkspaceInput({
        name: "  Payments   platform ",
        projectRefKeys: ["env:a", "env:a", "bogus", "env:b"],
      }),
    ).toEqual({ name: "Payments platform", projectRefKeys: ["env:a", "env:b"] });
  });

  it("rejects a workspace without a name or projects", () => {
    expect(normalizeWorkspaceInput({ name: "  ", projectRefKeys: ["env:a"] })).toBeNull();
    expect(normalizeWorkspaceInput({ name: "Empty", projectRefKeys: [] })).toBeNull();
  });
});
