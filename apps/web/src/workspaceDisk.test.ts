import { describe, expect, it } from "vite-plus/test";
import {
  parseWorkspaceConfig,
  serializeWorkspaceConfig,
  WORKSPACE_DISK_FILE,
} from "./workspaceDisk";

describe("workspaceDisk", () => {
  it("uses .t3/workspace.json path", () => {
    expect(WORKSPACE_DISK_FILE).toBe(".t3/workspace.json");
  });

  it("serializes workspace configuration into formatted JSON", () => {
    const raw = serializeWorkspaceConfig({
      name: "Monorepo Fullstack",
      projectRefKeys: ["local:proj-web", "local:proj-api"],
    });
    expect(raw).toContain('"name": "Monorepo Fullstack"');
    expect(raw).toContain('"local:proj-web"');
    expect(raw).toContain('"defaultLayout": "ide"');
  });

  it("parses valid workspace json", () => {
    const json = JSON.stringify({
      version: 1,
      name: "Mobile & Core",
      projectRefKeys: ["remote-1:mobile", "remote-1:core"],
    });
    const parsed = parseWorkspaceConfig(json);
    expect(parsed).toEqual({
      name: "Mobile & Core",
      projectRefKeys: ["remote-1:mobile", "remote-1:core"],
    });
  });

  it("rejects invalid or missing project refs", () => {
    expect(parseWorkspaceConfig("not json")).toBeNull();
    expect(parseWorkspaceConfig(JSON.stringify({ name: "Empty", projectRefKeys: [] }))).toBeNull();
    expect(parseWorkspaceConfig(JSON.stringify({ name: "", projectRefKeys: ["a:b"] }))).toBeNull();
  });
});
