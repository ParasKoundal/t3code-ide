import { useId, useMemo, useState } from "react";
import { create } from "zustand";

import type { SidebarProjectSnapshot } from "~/sidebarProjectGrouping";
import { useWorkspaceStore, type Workspace } from "~/workspaceStore";

import { serializeWorkspaceConfig, parseWorkspaceConfig } from "~/workspaceDisk";
import { toastManager } from "~/components/ui/toast";
import { ProjectFavicon } from "../ProjectFavicon";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

/** `null` creates a workspace; an id edits that workspace. */
const useWorkspaceDialogRequest = create<{ workspaceId: string | null; open: boolean }>(() => ({
  workspaceId: null,
  open: false,
}));

export function openWorkspaceDialog(workspaceId: string | null = null) {
  useWorkspaceDialogRequest.setState({ workspaceId, open: true });
}

function closeWorkspaceDialog() {
  useWorkspaceDialogRequest.setState({ open: false });
}

const projectRefKey = (ref: { environmentId: string; projectId: string }) =>
  `${ref.environmentId}:${ref.projectId}`;

interface WorkspaceDialogHostProps {
  projectGroups: readonly SidebarProjectSnapshot[];
  /** Called with the workspace id after a create or edit is saved. */
  onSaved: (workspaceId: string) => void;
}

export function WorkspaceDialogHost(props: WorkspaceDialogHostProps) {
  const request = useWorkspaceDialogRequest();
  const workspace = useWorkspaceStore((state) =>
    request.workspaceId === null
      ? null
      : (state.workspaces.find((candidate) => candidate.id === request.workspaceId) ?? null),
  );
  if (!request.open) return null;
  // Keyed so reopening for another workspace starts from that workspace's values.
  return (
    <WorkspaceDialog
      key={request.workspaceId ?? "new"}
      workspace={workspace}
      projectGroups={props.projectGroups}
      onSaved={props.onSaved}
    />
  );
}

function WorkspaceDialog(props: {
  workspace: Workspace | null;
  projectGroups: readonly SidebarProjectSnapshot[];
  onSaved: (workspaceId: string) => void;
}) {
  const id = useId();
  const { workspace, projectGroups } = props;
  const [name, setName] = useState(workspace?.name ?? "");
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<ReadonlySet<string>>(() => {
    const members = new Set(workspace?.projectRefKeys ?? []);
    return new Set(
      projectGroups
        .filter((group) => group.memberProjectRefs.some((ref) => members.has(projectRefKey(ref))))
        .map((group) => group.projectKey),
    );
  });
  // Members whose project is not loaded right now (an offline machine, say) are
  // kept as they are rather than silently dropped by an unrelated edit.
  const unlistedMemberKeys = useMemo(() => {
    const listed = new Set(
      projectGroups.flatMap((group) => group.memberProjectRefs.map(projectRefKey)),
    );
    return (workspace?.projectRefKeys ?? []).filter((key) => !listed.has(key));
  }, [projectGroups, workspace]);
  const projectRefKeys = useMemo(
    () => [
      ...unlistedMemberKeys,
      ...projectGroups
        .filter((group) => selectedGroupKeys.has(group.projectKey))
        .flatMap((group) => group.memberProjectRefs.map(projectRefKey)),
    ],
    [projectGroups, selectedGroupKeys, unlistedMemberKeys],
  );
  const canSave = name.trim().length > 0 && projectRefKeys.length > 0;

  const handleExport = async () => {
    const raw = serializeWorkspaceConfig({ name: name || "Workspace", projectRefKeys });
    try {
      await navigator.clipboard.writeText(raw);
      toastManager.add({
        title: "Workspace config copied",
        description: "Ready to save to .t3/workspace.json in your project",
      });
    } catch {
      toastManager.add({
        title: "Export failed",
        description: "Clipboard access was denied",
      });
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseWorkspaceConfig(text);
      if (!parsed) {
        toastManager.add({
          title: "Invalid workspace JSON",
          description: "Clipboard does not contain a valid .t3/workspace.json",
        });
        return;
      }
      setName(parsed.name);
      const importedKeys = new Set(parsed.projectRefKeys);
      setSelectedGroupKeys(
        new Set(
          projectGroups
            .filter((group) =>
              group.memberProjectRefs.some((ref) => importedKeys.has(projectRefKey(ref))),
            )
            .map((group) => group.projectKey),
        ),
      );
      toastManager.add({
        title: "Workspace loaded",
        description: `Imported "${parsed.name}" with ${parsed.projectRefKeys.length} projects`,
      });
    } catch {
      toastManager.add({
        title: "Import failed",
        description: "Could not read from clipboard",
      });
    }
  };

  const save = () => {
    const store = useWorkspaceStore.getState();
    const savedId = workspace
      ? store.update(workspace.id, { name, projectRefKeys })
        ? workspace.id
        : null
      : store.create({ name, projectRefKeys });
    if (savedId === null) return;
    closeWorkspaceDialog();
    props.onSaved(savedId);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeWorkspaceDialog();
      }}
    >
      <DialogPopup className="sm:max-w-md">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{workspace ? "Edit workspace" : "New workspace"}</DialogTitle>
            <DialogDescription>
              Group projects you work on together. Selecting the workspace scopes your threads and
              the IDE explorer to them.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input
                  id={`${id}-name`}
                  autoFocus
                  value={name}
                  maxLength={80}
                  placeholder="e.g. Payments platform"
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Projects</span>
                {projectGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add a project first.</p>
                ) : (
                  <ul className="-mx-1 flex max-h-72 flex-col gap-px overflow-y-auto">
                    {projectGroups.map((group) => {
                      const checked = selectedGroupKeys.has(group.projectKey);
                      return (
                        <li key={group.projectKey}>
                          <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-accent/60">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                setSelectedGroupKeys((current) => {
                                  const updated = new Set(current);
                                  if (next) updated.add(group.projectKey);
                                  else updated.delete(group.projectKey);
                                  return updated;
                                })
                              }
                            />
                            <ProjectFavicon project={group} className="size-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {group.displayName}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </DialogPanel>
          <DialogFooter>
            <div className="flex items-center gap-1.5 sm:mr-auto">
              <Button type="button" variant="outline" size="sm" onClick={handleExport}>
                Export JSON
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleImport}>
                Import JSON
              </Button>
            </div>
            {workspace ? (
              <Button
                type="button"
                variant="destructive-outline"
                onClick={() => {
                  useWorkspaceStore.getState().remove(workspace.id);
                  closeWorkspaceDialog();
                }}
              >
                Delete
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={closeWorkspaceDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {workspace ? "Save" : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
