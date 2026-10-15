export type GitFileState = "modified" | "added" | "deleted" | "untracked";

export interface GitFileStatusEntry {
  readonly path: string;
  readonly status: GitFileState;
  readonly insertions: number;
  readonly deletions: number;
}

export function buildGitStatusMap(
  files:
    | readonly {
        path: string;
        insertions: number;
        deletions: number;
      }[]
    | undefined
    | null,
): ReadonlyMap<string, GitFileStatusEntry> {
  const map = new Map<string, GitFileStatusEntry>();
  if (!files) return map;

  for (const file of files) {
    const p = String(file.path);
    let status: GitFileState = "modified";
    if (file.insertions > 0 && file.deletions === 0) {
      status = "added";
    } else if (file.deletions > 0 && file.insertions === 0) {
      status = "deleted";
    }
    map.set(p, {
      path: p,
      status,
      insertions: file.insertions,
      deletions: file.deletions,
    });
  }
  return map;
}

export function getDirectoryGitChangeCount(
  statusMap: ReadonlyMap<string, GitFileStatusEntry>,
  dirPath: string,
): number {
  const prefix = dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
  let count = 0;
  for (const [filePath] of statusMap) {
    if (filePath.startsWith(prefix)) {
      count++;
    }
  }
  return count;
}
