/**
 * Path rules for the explorer's create and rename actions. Paths are relative
 * to the project root with `/` separators, as the tree reports them; "" is the
 * root itself.
 */

export type TreeEntryKind = "file" | "directory";

/** Folder that a new entry created from `path` goes into: the folder itself, or a file's parent. */
export function entryParentDirectory(path: string, kind: TreeEntryKind): string {
  const trimmed = path.replace(/\/+$/, "");
  if (kind === "directory") return trimmed;
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? "" : trimmed.slice(0, slash);
}

/**
 * A name typed into the explorer, which may contain `/` to create or move
 * into nested folders. Returns an error message, or null when it is valid.
 */
export function validateEntryName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Enter a name.";
  if (trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed)) {
    return "Use a name relative to this folder.";
  }
  const segments = trimmed.split(/[\\/]/);
  if (segments.some((segment) => segment.length === 0)) return "Remove the empty folder name.";
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return "Names cannot be . or ..";
  }
  return null;
}

export function joinEntryPath(directory: string, name: string): string {
  const normalizedName = name.trim().replaceAll("\\", "/");
  return directory.length === 0 ? normalizedName : `${directory}/${normalizedName}`;
}

/** Last path segment, shown as the starting value when renaming. */
export function entryBaseName(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.slice(trimmed.lastIndexOf("/") + 1);
}

/** The new path for a rename typed relative to the entry's own folder. */
export function renamedEntryPath(path: string, name: string): string {
  return joinEntryPath(entryParentDirectory(path, "file"), name);
}
