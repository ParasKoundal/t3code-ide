import { beforeEach, describe, expect, it } from "vite-plus/test";
import { useExtensionsStore } from "./extensionsStore";
import type { OpenVsxExtension } from "./openVsxExtensions";

const sampleExtension: OpenVsxExtension = {
  id: "test.sample",
  namespace: "test",
  name: "sample",
  displayName: "Sample Extension",
  description: "A test extension",
  version: "1.0.0",
  downloadCount: 100,
  averageRating: 5.0,
  reviewCount: 10,
  iconUrl: null,
  sourceUrl: "https://github.com/test/sample",
  homepageUrl: null,
  manifestUrl: null,
  vsixUrl: null,
  sha256Url: null,
  categories: ["Programming Languages"],
  license: "MIT",
  timestamp: "2026-01-01T00:00:00Z",
};

describe("extensionsStore", () => {
  beforeEach(() => {
    useExtensionsStore.setState({
      installedExtensions: {},
      installingExtensionIds: {},
      extensionErrors: {},
    });
  });

  it("installs, toggles, and uninstalls an extension", async () => {
    const store = useExtensionsStore.getState();

    expect(store.isInstalled("test.sample")).toBe(false);

    const success = await store.installExtension(sampleExtension);
    expect(success).toBe(true);

    expect(useExtensionsStore.getState().isInstalled("test.sample")).toBe(true);
    const installed = useExtensionsStore.getState().installedExtensions["test.sample"];
    expect(installed).toBeDefined();
    expect(installed?.displayName).toBe("Sample Extension");
    expect(installed?.enabled).toBe(true);

    // Toggle enabled
    useExtensionsStore.getState().toggleExtension("test.sample");
    expect(useExtensionsStore.getState().installedExtensions["test.sample"]?.enabled).toBe(false);

    useExtensionsStore.getState().toggleExtension("test.sample");
    expect(useExtensionsStore.getState().installedExtensions["test.sample"]?.enabled).toBe(true);

    // Uninstall
    await useExtensionsStore.getState().uninstallExtension("test.sample");
    expect(useExtensionsStore.getState().isInstalled("test.sample")).toBe(false);
    expect(useExtensionsStore.getState().installedExtensions["test.sample"]).toBeUndefined();
  });
});
