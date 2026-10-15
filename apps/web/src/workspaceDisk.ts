/**
 * Workspace disk configuration: reads and writes .t3/workspace.json
 * in project roots to allow persistent and version-controlled workspace definitions.
 */

export interface DiskWorkspaceConfig {
  readonly $schema?: string;
  readonly version: 1;
  readonly name: string;
  readonly projectRefKeys: readonly string[];
  readonly settings?: {
    readonly defaultLayout?: "ide" | "default";
  };
}

export const WORKSPACE_DISK_FILE = ".t3/workspace.json";

export function serializeWorkspaceConfig(workspace: {
  readonly name: string;
  readonly projectRefKeys: readonly string[];
}): string {
  const config: DiskWorkspaceConfig = {
    $schema: "https://t3.codes/schema/workspace.json",
    version: 1,
    name: workspace.name,
    projectRefKeys: workspace.projectRefKeys,
    settings: {
      defaultLayout: "ide",
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function parseWorkspaceConfig(
  rawJson: string,
): { name: string; projectRefKeys: string[] } | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.name !== "string" || !Array.isArray(parsed.projectRefKeys)) {
      return null;
    }
    const name = parsed.name.trim();
    const projectRefKeys = parsed.projectRefKeys.filter(
      (k: unknown): k is string => typeof k === "string" && k.includes(":"),
    );
    if (!name || projectRefKeys.length === 0) return null;
    return { name, projectRefKeys };
  } catch {
    return null;
  }
}
