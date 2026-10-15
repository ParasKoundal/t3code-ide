import { describe, expect, it } from "vite-plus/test";
import { parseOpenVsxExtension, POPULAR_EXTENSIONS } from "./openVsxExtensions";

describe("openVsxExtensions", () => {
  it("parses valid Open VSX extension records", () => {
    const raw = {
      namespace: "esbenp",
      name: "prettier-vscode",
      displayName: "Prettier - Code formatter",
      description: "Code formatter using Prettier",
      version: "11.0.0",
      downloadCount: 45000000,
      averageRating: 4.7,
      reviewCount: 380,
      files: {
        icon: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/icon.png",
        manifest: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/package.json",
        download: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/prettier.vsix",
        sha256: "https://open-vsx.org/api/esbenp/prettier-vscode/11.0.0/file/prettier.vsix.sha256",
      },
      categories: ["Formatters"],
      license: "MIT",
    };

    const parsed = parseOpenVsxExtension(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe("esbenp.prettier-vscode");
    expect(parsed?.displayName).toBe("Prettier - Code formatter");
    expect(parsed?.downloadCount).toBe(45000000);
    expect(parsed?.categories).toEqual(["Formatters"]);
    expect(parsed?.license).toBe("MIT");
  });

  it("rejects invalid records missing namespace or name", () => {
    expect(parseOpenVsxExtension(null)).toBeNull();
    expect(parseOpenVsxExtension({})).toBeNull();
    expect(parseOpenVsxExtension({ namespace: "test" })).toBeNull();
    expect(parseOpenVsxExtension({ name: "test" })).toBeNull();
  });

  it("contains curated popular extensions", () => {
    expect(POPULAR_EXTENSIONS.length).toBeGreaterThan(0);
    const python = POPULAR_EXTENSIONS.find((e) => e.id === "ms-python.python");
    expect(python).toBeDefined();
    expect(python?.displayName).toBe("Python");
  });
});
