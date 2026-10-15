import { describe, expect, it } from "vite-plus/test";

import {
  LANGUAGE_SERVERS,
  languageServerForPath,
  resolveLanguageServerCommand,
} from "./languageServerRegistry.ts";

const typescript = LANGUAGE_SERVERS.find((spec) => spec.id === "typescript")!;
const python = LANGUAGE_SERVERS.find((spec) => spec.id === "python")!;

describe("languageServerForPath", () => {
  it("matches by extension, case-insensitively", () => {
    expect(languageServerForPath("src/App.TSX")?.languageId).toBe("typescriptreact");
    expect(languageServerForPath("main.go")?.spec.id).toBe("go");
    expect(languageServerForPath("README.md")).toBeNull();
    expect(languageServerForPath("dir.ts/Makefile")).toBeNull();
  });
});

describe("resolveLanguageServerCommand", () => {
  const base = {
    projectRoot: "/repo",
    pathDirectories: ["/usr/local/bin", "/usr/bin"],
    pathSeparator: "/",
    executableSuffixes: [""],
  };

  it("prefers the project's own binary over PATH", () => {
    const installed = new Set([
      "/repo/node_modules/.bin/typescript-language-server",
      "/usr/local/bin/typescript-language-server",
    ]);
    expect(
      resolveLanguageServerCommand({
        ...base,
        spec: typescript,
        isExecutable: (path) => installed.has(path),
      }),
    ).toEqual({ command: "/repo/node_modules/.bin/typescript-language-server", args: ["--stdio"] });
  });

  it("falls through candidates in preference order and reports none installed", () => {
    expect(
      resolveLanguageServerCommand({
        ...base,
        spec: python,
        isExecutable: (path) => path === "/usr/bin/pyright-langserver",
      }),
    ).toEqual({ command: "/usr/bin/pyright-langserver", args: ["--stdio"] });
    expect(
      resolveLanguageServerCommand({ ...base, spec: python, isExecutable: () => false }),
    ).toBeNull();
  });
});
