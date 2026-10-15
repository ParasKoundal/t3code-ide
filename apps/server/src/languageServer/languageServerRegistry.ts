/**
 * Language servers T3 Code can start for a file, by extension. Each entry
 * lists candidate commands in preference order; the first one installed in
 * the project (`node_modules/.bin`) or on PATH is used.
 */

export interface LanguageServerSpec {
  readonly id: string;
  readonly name: string;
  /** Shown when no candidate command is installed. */
  readonly installHint: string;
  readonly languageIdByExtension: Readonly<Record<string, string>>;
  readonly commands: ReadonlyArray<readonly [command: string, ...args: string[]]>;
}

export const LANGUAGE_SERVERS: readonly LanguageServerSpec[] = [
  {
    id: "typescript",
    name: "TypeScript",
    installHint: "npm install -g typescript typescript-language-server",
    languageIdByExtension: {
      ".ts": "typescript",
      ".mts": "typescript",
      ".cts": "typescript",
      ".tsx": "typescriptreact",
      ".js": "javascript",
      ".mjs": "javascript",
      ".cjs": "javascript",
      ".jsx": "javascriptreact",
    },
    commands: [["typescript-language-server", "--stdio"]],
  },
  {
    id: "python",
    name: "Python",
    installHint: "pip install basedpyright (or npm install -g pyright)",
    languageIdByExtension: { ".py": "python", ".pyi": "python" },
    commands: [
      ["basedpyright-langserver", "--stdio"],
      ["pyright-langserver", "--stdio"],
      ["pylsp"],
    ],
  },
  {
    id: "go",
    name: "Go",
    installHint: "go install golang.org/x/tools/gopls@latest",
    languageIdByExtension: { ".go": "go" },
    commands: [["gopls"]],
  },
  {
    id: "rust",
    name: "Rust",
    installHint: "rustup component add rust-analyzer",
    languageIdByExtension: { ".rs": "rust" },
    commands: [["rust-analyzer"]],
  },
];

export function languageServerForPath(
  relativePath: string,
): { spec: LanguageServerSpec; languageId: string } | null {
  const lower = relativePath.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1 || lower.lastIndexOf("/") > dot) return null;
  const extension = lower.slice(dot);
  for (const spec of LANGUAGE_SERVERS) {
    const languageId = spec.languageIdByExtension[extension];
    if (languageId) return { spec, languageId };
  }
  return null;
}

/**
 * First installed candidate command. `isExecutable` checks an absolute path;
 * project-local binaries win over PATH so a repo's pinned tooling is used.
 */
export function resolveLanguageServerCommand(input: {
  readonly spec: LanguageServerSpec;
  readonly projectRoot: string;
  readonly pathDirectories: readonly string[];
  readonly pathSeparator: string;
  readonly executableSuffixes: readonly string[];
  readonly isExecutable: (absolutePath: string) => boolean;
}): { command: string; args: readonly string[] } | null {
  const join = (directory: string, name: string) =>
    `${directory.replace(/[\\/]+$/, "")}${input.pathSeparator}${name}`;
  const localBin = join(join(input.projectRoot, "node_modules"), ".bin");
  for (const [command, ...args] of input.spec.commands) {
    for (const directory of [localBin, ...input.pathDirectories]) {
      for (const suffix of input.executableSuffixes) {
        const candidate = join(directory, `${command}${suffix}`);
        if (input.isExecutable(candidate)) return { command: candidate, args };
      }
    }
  }
  return null;
}
