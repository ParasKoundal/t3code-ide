import { describe, expect, it } from "vite-plus/test";

import { resolveWorkspaceRootFile } from "./workspaceRoots";

const api = { cwd: "/code/api", title: "api" };
const nested = { cwd: "/code/api/packages/sdk", title: "sdk" };
const web = { cwd: "/code/web/", title: "web" };

describe("resolveWorkspaceRootFile", () => {
  it("maps an absolute path into the innermost containing root", () => {
    expect(resolveWorkspaceRootFile("/code/api/packages/sdk/src/index.ts", [api, nested])).toEqual({
      root: nested,
      relativePath: "src/index.ts",
    });
    expect(resolveWorkspaceRootFile("/code/web/app.tsx", [api, web])).toEqual({
      root: web,
      relativePath: "app.tsx",
    });
  });

  it("leaves relative paths, root folders, and outside files alone", () => {
    expect(resolveWorkspaceRootFile("src/index.ts", [api])).toBeNull();
    expect(resolveWorkspaceRootFile("/code/api", [api])).toBeNull();
    expect(resolveWorkspaceRootFile("/code/apiary/x.ts", [api])).toBeNull();
  });
});
