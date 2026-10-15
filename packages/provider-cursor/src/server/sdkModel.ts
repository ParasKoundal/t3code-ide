import type {
  ModelSelection as CursorSdkModelSelection,
  ModelParameterValue,
  SDKModel,
} from "@cursor/sdk";
import type { ModelSelection } from "@t3tools/contracts";

const CURSOR_SDK_PARAMETER_TO_PROVIDER_OPTION: Readonly<Record<string, string>> = {
  context: "contextWindow",
  fast: "fastMode",
};

const PROVIDER_OPTION_TO_CURSOR_SDK_PARAMETER: Readonly<Record<string, string>> = {
  contextWindow: "context",
  fastMode: "fast",
};

export function cursorSdkProviderOptionId(parameterId: string): string {
  return CURSOR_SDK_PARAMETER_TO_PROVIDER_OPTION[parameterId] ?? parameterId;
}

function cursorSdkParameterId(providerOptionId: string): string {
  return PROVIDER_OPTION_TO_CURSOR_SDK_PARAMETER[providerOptionId] ?? providerOptionId;
}

export function cursorSdkParameterPriority(parameterId: string): number {
  switch (parameterId) {
    case "effort":
    case "reasoning":
      return 0;
    case "context":
      return 1;
    case "fast":
      return 2;
    case "thinking":
      return 3;
    default:
      return 4;
  }
}

export function cursorSdkModelSelection(modelSelection: ModelSelection): CursorSdkModelSelection {
  return {
    id: modelSelection.model === "auto" ? "default" : modelSelection.model,
    ...(modelSelection.options === undefined || modelSelection.options.length === 0
      ? {}
      : {
          params: modelSelection.options.map((option): ModelParameterValue => ({
            id: cursorSdkParameterId(option.id),
            value: String(option.value),
          })),
        }),
  };
}

/**
 * Completes a selection with the model's default variant for any parameter it
 * leaves out. Plans with fixed model settings (Cursor Plus) reject a request
 * whose parameters do not match an allowed variant, and a selection that names
 * no parameters, as delegated and scheduled tasks send, does not.
 */
export function withCursorSdkDefaultParams(
  selection: CursorSdkModelSelection,
  models: ReadonlyArray<SDKModel>,
): CursorSdkModelSelection {
  const defaults = models
    .find((model) => model.id === selection.id)
    ?.variants?.find((variant) => variant.isDefault)?.params;
  if (!defaults || defaults.length === 0) return selection;
  const chosen = selection.params ?? [];
  const chosenIds = new Set(chosen.map((param) => param.id));
  const missing = defaults.filter((param) => !chosenIds.has(param.id));
  return missing.length === 0 ? selection : { ...selection, params: [...chosen, ...missing] };
}
