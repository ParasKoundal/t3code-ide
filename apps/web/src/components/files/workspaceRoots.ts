import { isAbsolutePath, workspaceRelativeFilePath } from "@t3tools/shared/path";

/** Another project's folder shown beside the thread's own in a workspace explorer. */
export interface WorkspaceRoot {
  readonly cwd: string;
  readonly title: string;
}

/**
 * Files from other workspace roots open as absolute paths, which the editor
 * would otherwise treat as read-only host files. Mapping one back to the
 * innermost root that contains it lets it be read and saved relative to that
 * root like any workspace file.
 */
export function resolveWorkspaceRootFile(
  path: string,
  roots: readonly WorkspaceRoot[],
): { root: WorkspaceRoot; relativePath: string } | null {
  if (!isAbsolutePath(path)) return null;
  let match: { root: WorkspaceRoot; relativePath: string } | null = null;
  for (const root of roots) {
    const relativePath = workspaceRelativeFilePath(path, root.cwd);
    if (relativePath === null || relativePath === ".") continue;
    if (match === null || root.cwd.length > match.root.cwd.length) match = { root, relativePath };
  }
  return match;
}
