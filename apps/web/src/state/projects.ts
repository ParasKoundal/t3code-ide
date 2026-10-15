import { createEnvironmentProjectAtoms } from "@t3tools/client-runtime/state/projects";
import { createProjectEnvironmentAtoms } from "@t3tools/client-runtime/state/projects";
import {
  createEnvironmentRpcCommand,
  createEnvironmentRpcQueryAtomFamily,
  createEnvironmentRpcSubscriptionAtomFamily,
} from "@t3tools/client-runtime/state/runtime";
import { WS_METHODS } from "@t3tools/contracts";

import { environmentCatalog } from "../connection/catalog";
import { connectionAtomRuntime } from "../connection/runtime";
import { environmentSnapshotAtom } from "./shell";
import { serverEnvironment } from "./server";

export const environmentProjects = createEnvironmentProjectAtoms({
  catalogValueAtom: environmentCatalog.catalogValueAtom,
  snapshotAtom: environmentSnapshotAtom,
  serverConfigValueAtom: serverEnvironment.configValueAtom,
});
export const projectEnvironment = createProjectEnvironmentAtoms(connectionAtomRuntime, {
  projectAtom: environmentProjects.projectAtom,
});
/**
 * Web-only: project content search backs the ⇧⌘F dialog, which has no mobile
 * surface, so the atom family lives here instead of the shared client-runtime
 * project atoms consumed by the mobile app.
 */
export const projectContentSearch = createEnvironmentRpcQueryAtomFamily(connectionAtomRuntime, {
  label: "environment-data:projects:search-contents",
  tag: WS_METHODS.projectsSearchContents,
  staleTimeMs: 5_000,
  idleTtlMs: 60_000,
});

/**
 * Web-only like content search: language intelligence backs the desktop and
 * web editor, which mobile does not have. Diagnostics stream per open file;
 * the server stops a language server once no file needs it.
 */
export const languageServerDiagnostics = createEnvironmentRpcSubscriptionAtomFamily(
  connectionAtomRuntime,
  {
    label: "environment-data:language-server:diagnostics",
    tag: WS_METHODS.languageServerDiagnostics,
    idleTtlMs: 5_000,
  },
);
export const languageServerHover = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "environment-data:language-server:hover",
  tag: WS_METHODS.languageServerHover,
});
export const languageServerDefinition = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "environment-data:language-server:definition",
  tag: WS_METHODS.languageServerDefinition,
});
