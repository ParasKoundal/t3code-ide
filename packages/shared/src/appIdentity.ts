/**
 * Identity that keeps T3 Code IDE separate from the upstream T3 Code app, so
 * both can be installed and run at once: its own data folder, desktop link
 * scheme, and OS application id. Forks that want to share state with T3 Code
 * change these back.
 */

/** Data folder under the home directory. `T3CODE_HOME` still overrides it. */
export const APP_HOME_DIRNAME = ".t3code-ide";

/** Scheme the packaged desktop app serves its renderer from and opens links with. */
export const DESKTOP_SCHEME = "t3code-ide";
export const DESKTOP_DEVELOPMENT_SCHEME = "t3code-ide-dev";

export function desktopScheme(development: boolean): string {
  return development ? DESKTOP_DEVELOPMENT_SCHEME : DESKTOP_SCHEME;
}

/** Origins of the desktop renderer, which the server accepts like its own. */
export const DESKTOP_RENDERER_ORIGINS = [
  `${DESKTOP_SCHEME}://app`,
  `${DESKTOP_DEVELOPMENT_SCHEME}://app`,
] as const;

/** macOS bundle id and Windows AppUserModelID. */
export const DESKTOP_APP_ID = "com.paraskoundal.t3codeide";

/** Linux executable and window class. */
export const DESKTOP_EXECUTABLE_NAME = "t3code-ide";

/**
 * GitHub repository whose releases this app installs runtimes and updates
 * from. Pointing at upstream would install T3 Code's server, not this app's.
 */
export const RELEASE_REPOSITORY = "ParasKoundal/t3code-ide";

/** Background service names, distinct from T3 Code's own service. */
export const BACKGROUND_SERVICE_NAME = DESKTOP_EXECUTABLE_NAME;
export const BACKGROUND_SERVICE_LAUNCHD_LABEL = `${DESKTOP_APP_ID}.service`;
