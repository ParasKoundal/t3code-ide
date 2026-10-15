import * as Schema from "effect/Schema";

import { NonNegativeInt, TrimmedNonEmptyString } from "./baseSchemas.ts";

/** A project file a language server should analyze. `relativePath` is relative to `cwd`. */
export const LanguageServerDocumentInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
  relativePath: TrimmedNonEmptyString,
});
export type LanguageServerDocumentInput = typeof LanguageServerDocumentInput.Type;

/** Zero-based line and character, as LSP and the editor count them. */
export const LanguageServerPositionInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
  relativePath: TrimmedNonEmptyString,
  line: NonNegativeInt,
  character: NonNegativeInt,
});
export type LanguageServerPositionInput = typeof LanguageServerPositionInput.Type;

export const LanguageServerDiagnosticSeverity = Schema.Literals([
  "error",
  "warning",
  "info",
  "hint",
]);
export type LanguageServerDiagnosticSeverity = typeof LanguageServerDiagnosticSeverity.Type;

export const LanguageServerDiagnostic = Schema.Struct({
  startLine: NonNegativeInt,
  startCharacter: NonNegativeInt,
  endLine: NonNegativeInt,
  endCharacter: NonNegativeInt,
  severity: LanguageServerDiagnosticSeverity,
  message: Schema.String,
  source: Schema.optional(Schema.String),
});
export type LanguageServerDiagnostic = typeof LanguageServerDiagnostic.Type;

/**
 * Diagnostics for one file as it is saved on disk. The stream sends a new
 * `diagnostics` event whenever the server republishes for the file.
 */
export const LanguageServerDiagnosticsEvent = Schema.Union([
  // No language server is known for this kind of file.
  Schema.Struct({ type: Schema.Literal("unsupported") }),
  // A server is known but not installed on the environment.
  Schema.Struct({
    type: Schema.Literal("unavailable"),
    serverName: Schema.String,
    installHint: Schema.String,
  }),
  Schema.Struct({
    type: Schema.Literal("diagnostics"),
    serverName: Schema.String,
    diagnostics: Schema.Array(LanguageServerDiagnostic),
  }),
  Schema.Struct({
    type: Schema.Literal("stopped"),
    serverName: Schema.String,
    reason: Schema.String,
  }),
]);
export type LanguageServerDiagnosticsEvent = typeof LanguageServerDiagnosticsEvent.Type;

export const LanguageServerHoverResult = Schema.Struct({
  /** Markdown, or null when the server has nothing for the position. */
  contents: Schema.NullOr(Schema.String),
});
export type LanguageServerHoverResult = typeof LanguageServerHoverResult.Type;

export const LanguageServerLocation = Schema.Struct({
  /** Absolute path on the environment. */
  path: TrimmedNonEmptyString,
  line: NonNegativeInt,
  character: NonNegativeInt,
});
export type LanguageServerLocation = typeof LanguageServerLocation.Type;

export const LanguageServerDefinitionResult = Schema.Struct({
  locations: Schema.Array(LanguageServerLocation),
});
export type LanguageServerDefinitionResult = typeof LanguageServerDefinitionResult.Type;

export class LanguageServerError extends Schema.TaggedError<LanguageServerError>()(
  "LanguageServerError",
  {
    message: TrimmedNonEmptyString,
    cause: Schema.optional(Schema.Defect()),
  },
) {}
