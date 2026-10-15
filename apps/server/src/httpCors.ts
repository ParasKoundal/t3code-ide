import { ORCHESTRATION_PROTOCOL_HEADER } from "@t3tools/contracts";
import { DESKTOP_RENDERER_ORIGINS } from "@t3tools/shared/appIdentity";

export const browserApiCorsAllowedMethods = ["GET", "POST", "OPTIONS"] as const;
export const browserApiCorsAllowedHeaders = [
  "authorization",
  "b3",
  "traceparent",
  "content-type",
  "dpop",
  ORCHESTRATION_PROTOCOL_HEADER,
] as const;

/** Origins of the Electron renderer, packaged and dev. */
export { DESKTOP_RENDERER_ORIGINS };
