import type { SDKModel } from "@cursor/sdk";
import { describe, expect, it } from "vite-plus/test";

import { withCursorSdkDefaultParams } from "./sdkModel.ts";

const grok = {
  id: "grok-4.7",
  displayName: "Grok 4.7",
  variants: [
    {
      params: [
        { id: "context", value: "1m" },
        { id: "reasoning_effort", value: "high" },
      ],
    },
    {
      isDefault: true,
      params: [
        { id: "context", value: "256k" },
        { id: "fast", value: "false" },
        { id: "reasoning_effort", value: "medium" },
      ],
    },
  ],
} as unknown as SDKModel;

describe("withCursorSdkDefaultParams", () => {
  it("sends the default variant when a selection names no parameters", () => {
    expect(withCursorSdkDefaultParams({ id: "grok-4.7" }, [grok])).toEqual({
      id: "grok-4.7",
      params: [
        { id: "context", value: "256k" },
        { id: "fast", value: "false" },
        { id: "reasoning_effort", value: "medium" },
      ],
    });
  });

  it("keeps chosen parameters and fills only the missing ones", () => {
    expect(
      withCursorSdkDefaultParams({ id: "grok-4.7", params: [{ id: "context", value: "1m" }] }, [
        grok,
      ]).params,
    ).toEqual([
      { id: "context", value: "1m" },
      { id: "fast", value: "false" },
      { id: "reasoning_effort", value: "medium" },
    ]);
  });

  it("leaves unknown models and models without a default variant alone", () => {
    const selection = { id: "composer-2.5" };
    expect(withCursorSdkDefaultParams(selection, [grok])).toBe(selection);
    expect(
      withCursorSdkDefaultParams({ id: "grok-4.7" }, [{ ...grok, variants: [] } as SDKModel]),
    ).toEqual({ id: "grok-4.7" });
  });
});
