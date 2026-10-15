/**
 * Open VSX client and extension resolution.
 *
 * Provides search, popular extension discovery, and metadata extraction
 * for extensions registered on https://open-vsx.org.
 */

const OPEN_VSX_SEARCH_URL = "https://open-vsx.org/api/-/search";
const SEARCH_REQUEST_TIMEOUT_MS = 10_000;
const MAX_SEARCH_BYTES = 1024 * 1024; // 1 MB

export type OpenVsxSort = "downloadCount" | "rating" | "timestamp" | "relevance";

export type OpenVsxExtensionCategory =
  | "All"
  | "Programming Languages"
  | "Themes"
  | "Linters"
  | "Formatters"
  | "Snippets"
  | "Keymaps"
  | "Other";

export interface OpenVsxExtension {
  id: string; // "namespace.name"
  namespace: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  downloadCount: number;
  averageRating: number;
  reviewCount: number;
  iconUrl: string | null;
  sourceUrl: string | null;
  homepageUrl: string | null;
  manifestUrl: string | null;
  vsixUrl: string | null;
  sha256Url: string | null;
  categories: string[];
  license: string | null;
  timestamp: string | null;
}

export interface OpenVsxSearchOptions {
  category?: string | undefined;
  sortBy?: OpenVsxSort | undefined;
  size?: number | undefined;
  offset?: number | undefined;
  signal?: AbortSignal | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trustedUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function publicUrl(value: unknown): string | null {
  if (typeof value === "string") return trustedUrl(value);
  if (isRecord(value) && typeof value.url === "string") return trustedUrl(value.url);
  return null;
}

export function parseOpenVsxExtension(value: unknown): OpenVsxExtension | null {
  if (!isRecord(value)) return null;
  const namespace = typeof value.namespace === "string" ? value.namespace.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!namespace || !name) return null;

  const displayName =
    (typeof value.displayName === "string" ? value.displayName.trim() : "") || name;
  const version = typeof value.version === "string" ? value.version.trim() : "0.0.1";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const downloadCount =
    typeof value.downloadCount === "number" && Number.isFinite(value.downloadCount)
      ? value.downloadCount
      : 0;
  const averageRating =
    typeof value.averageRating === "number" && Number.isFinite(value.averageRating)
      ? value.averageRating
      : 0;
  const reviewCount =
    typeof value.reviewCount === "number" && Number.isFinite(value.reviewCount)
      ? value.reviewCount
      : 0;

  const files = isRecord(value.files) ? value.files : {};
  const iconUrl = trustedUrl(files.icon);
  const manifestUrl = trustedUrl(files.manifest);
  const vsixUrl = trustedUrl(files.download);
  const sha256Url = trustedUrl(files.sha256);

  const categories = Array.isArray(value.categories)
    ? value.categories.filter((cat): cat is string => typeof cat === "string" && cat.length > 0)
    : [];

  const license = typeof value.license === "string" ? value.license.trim() : null;
  const timestamp = typeof value.timestamp === "string" ? value.timestamp.trim() : null;

  const sourceUrl =
    publicUrl(value.repository) ?? publicUrl(value.homepage) ?? publicUrl(value.url);
  const homepageUrl = publicUrl(value.homepage) ?? sourceUrl;

  return {
    id: `${namespace}.${name}`,
    namespace,
    name,
    displayName,
    description,
    version,
    downloadCount,
    averageRating,
    reviewCount,
    iconUrl,
    sourceUrl,
    homepageUrl,
    manifestUrl,
    vsixUrl,
    sha256Url,
    categories,
    license,
    timestamp,
  };
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (parentSignal?.aborted) abort();
  else parentSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, SEARCH_REQUEST_TIMEOUT_MS);
  try {
    return await operation(controller.signal);
  } catch (cause) {
    if (controller.signal.aborted && !parentSignal?.aborted) {
      throw new Error("Open VSX request timed out.", { cause });
    }
    throw cause;
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abort);
  }
}

/**
 * Searches extensions on the Open VSX registry.
 */
export async function searchOpenVsxExtensions(
  query: string,
  options: OpenVsxSearchOptions = {},
): Promise<OpenVsxExtension[]> {
  const { category, sortBy = "downloadCount", size = 24, offset = 0, signal } = options;
  const url = new URL(OPEN_VSX_SEARCH_URL);

  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    url.searchParams.set("query", trimmedQuery);
  }
  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("sortOrder", "desc");
  url.searchParams.set("size", String(Math.min(size, 50)));
  if (offset > 0) {
    url.searchParams.set("offset", String(offset));
  }

  const data = await withTimeout(async (reqSignal) => {
    const response = await fetch(url.toString(), {
      signal: reqSignal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Open VSX search returned HTTP ${response.status}`);
    }
    const text = await response.text();
    if (text.length > MAX_SEARCH_BYTES) {
      throw new Error("Open VSX returned a response that is too large.");
    }
    return JSON.parse(text) as unknown;
  }, signal);

  if (!isRecord(data) || !Array.isArray(data.extensions)) {
    return [];
  }

  const results: OpenVsxExtension[] = [];
  for (const raw of data.extensions) {
    const parsed = parseOpenVsxExtension(raw);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}

/**
 * Curated popular extensions across various development categories.
 * Provides instant results when user first opens the Extensions surface.
 */
export const POPULAR_EXTENSIONS: OpenVsxExtension[] = [
  {
    id: "ms-python.python",
    namespace: "ms-python",
    name: "python",
    displayName: "Python",
    description:
      "Python language support with extension access points for IntelliSense, Linting, Formatting, and more.",
    version: "2026.4.0",
    downloadCount: 60750000,
    averageRating: 4.5,
    reviewCount: 420,
    iconUrl: "https://open-vsx.org/api/ms-python/python/2026.4.0/file/icon.png",
    sourceUrl: "https://github.com/microsoft/vscode-python",
    homepageUrl: "https://github.com/microsoft/vscode-python",
    manifestUrl: "https://open-vsx.org/api/ms-python/python/2026.4.0/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/ms-python/python/2026.4.0/file/ms-python.python-2026.4.0.vsix",
    sha256Url: null,
    categories: ["Programming Languages"],
    license: "MIT",
    timestamp: "2026-03-01T00:00:00Z",
  },
  {
    id: "esbenp.prettier-vscode",
    namespace: "esbenp",
    name: "prettier-vscode",
    displayName: "Prettier - Code formatter",
    description:
      "Code formatter using Prettier for JavaScript, TypeScript, CSS, HTML, JSON and more.",
    version: "11.0.0",
    downloadCount: 45000000,
    averageRating: 4.7,
    reviewCount: 380,
    iconUrl: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/icon.png",
    sourceUrl: "https://github.com/prettier/prettier-vscode",
    homepageUrl: "https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode",
    manifestUrl: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/esbenp.prettier-vscode-11.0.0.vsix",
    sha256Url: null,
    categories: ["Formatters"],
    license: "MIT",
    timestamp: "2026-02-15T00:00:00Z",
  },
  {
    id: "rust-lang.rust-analyzer",
    namespace: "rust-lang",
    name: "rust-analyzer",
    displayName: "rust-analyzer",
    description:
      "Rust language support with full code completion, diagnostics, and semantic highlighting.",
    version: "0.4.2340",
    downloadCount: 18500000,
    averageRating: 4.9,
    reviewCount: 290,
    iconUrl: "https://open-vsx.org/api/rust-lang/rust-analyzer/0.4.2340/file/icon.png",
    sourceUrl: "https://github.com/rust-lang/rust-analyzer",
    homepageUrl: "https://rust-analyzer.github.io",
    manifestUrl: "https://open-vsx.org/api/rust-lang/rust-analyzer/0.4.2340/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/rust-lang/rust-analyzer/0.4.2340/file/rust-lang.rust-analyzer-0.4.2340.vsix",
    sha256Url: null,
    categories: ["Programming Languages"],
    license: "Apache-2.0",
    timestamp: "2026-03-10T00:00:00Z",
  },
  {
    id: "catppuccin.catppuccin-vsc",
    namespace: "catppuccin",
    name: "catppuccin-vsc",
    displayName: "Catppuccin for VS Code",
    description: "Soothing pastel theme for VS Code featuring Latte, Frappé, Macchiato, and Mocha.",
    version: "3.16.0",
    downloadCount: 12000000,
    averageRating: 4.9,
    reviewCount: 310,
    iconUrl: "https://open-vsx.org/api/catppuccin/catppuccin-vsc/3.16.0/file/icon.png",
    sourceUrl: "https://github.com/catppuccin/vscode",
    homepageUrl: "https://github.com/catppuccin/vscode",
    manifestUrl: "https://open-vsx.org/api/catppuccin/catppuccin-vsc/3.16.0/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/catppuccin/catppuccin-vsc/3.16.0/file/catppuccin.catppuccin-vsc-3.16.0.vsix",
    sha256Url: null,
    categories: ["Themes"],
    license: "MIT",
    timestamp: "2026-01-20T00:00:00Z",
  },
  {
    id: "dracula-theme.theme-dracula",
    namespace: "dracula-theme",
    name: "theme-dracula",
    displayName: "Dracula Official",
    description:
      "The official Dracula theme. A dark theme for 300+ apps, designed for focus and aesthetics.",
    version: "2.25.1",
    downloadCount: 15400000,
    averageRating: 4.8,
    reviewCount: 450,
    iconUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/icon.png",
    sourceUrl: "https://github.com/dracula/visual-studio-code",
    homepageUrl: "https://draculatheme.com",
    manifestUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/dracula-theme.theme-dracula-2.25.1.vsix",
    sha256Url: null,
    categories: ["Themes"],
    license: "MIT",
    timestamp: "2026-01-10T00:00:00Z",
  },
  {
    id: "golang.go",
    namespace: "golang",
    name: "go",
    displayName: "Go",
    description: "Rich Go language support for Visual Studio Code using the gopls language server.",
    version: "0.45.0",
    downloadCount: 22000000,
    averageRating: 4.6,
    reviewCount: 260,
    iconUrl: "https://open-vsx.org/api/golang/go/0.45.0/file/icon.png",
    sourceUrl: "https://github.com/golang/vscode-go",
    homepageUrl: "https://github.com/golang/vscode-go",
    manifestUrl: "https://open-vsx.org/api/golang/go/0.45.0/file/package.json",
    vsixUrl: "https://open-vsx.org/api/golang/go/0.45.0/file/golang.go-0.45.0.vsix",
    sha256Url: null,
    categories: ["Programming Languages"],
    license: "MIT",
    timestamp: "2026-02-28T00:00:00Z",
  },
  {
    id: "bradlc.vscode-tailwindcss",
    namespace: "bradlc",
    name: "vscode-tailwindcss",
    displayName: "Tailwind CSS IntelliSense",
    description:
      "Intelligent Tailwind CSS tooling with autocomplete, syntax highlighting, and linting.",
    version: "0.14.3",
    downloadCount: 16500000,
    averageRating: 4.8,
    reviewCount: 215,
    iconUrl: "https://open-vsx.org/api/bradlc/vscode-tailwindcss/0.14.3/file/icon.png",
    sourceUrl: "https://github.com/tailwindlabs/tailwindcss-intellisense",
    homepageUrl: "https://github.com/tailwindlabs/tailwindcss-intellisense",
    manifestUrl: "https://open-vsx.org/api/bradlc/vscode-tailwindcss/0.14.3/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/bradlc/vscode-tailwindcss/0.14.3/file/bradlc.vscode-tailwindcss-0.14.3.vsix",
    sha256Url: null,
    categories: ["Snippets"],
    license: "MIT",
    timestamp: "2026-03-05T00:00:00Z",
  },
  {
    id: "dbaeumer.vscode-eslint",
    namespace: "dbaeumer",
    name: "vscode-eslint",
    displayName: "ESLint",
    description: "Integrates ESLint JavaScript into VS Code.",
    version: "3.0.10",
    downloadCount: 38000000,
    averageRating: 4.6,
    reviewCount: 310,
    iconUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/icon.png",
    sourceUrl: "https://github.com/microsoft/vscode-eslint",
    homepageUrl: "https://github.com/microsoft/vscode-eslint",
    manifestUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/package.json",
    vsixUrl:
      "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
    sha256Url: null,
    categories: ["Linters"],
    license: "MIT",
    timestamp: "2026-02-10T00:00:00Z",
  },
];
