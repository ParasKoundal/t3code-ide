import { describe, expect, it } from "vite-plus/test";
import { extractDocumentSymbols } from "./symbolExtractor";

describe("symbolExtractor", () => {
  it("extracts TypeScript functions, classes, interfaces and types", () => {
    const code = `
export interface UserConfig {
  id: string;
}

export type UserStatus = "active" | "idle";

export class UserService {
  constructor() {}
}

export function fetchUser(id: string) {
  return null;
}

export const updateUser = async (id: string) => {
  return true;
};

const DEFAULT_TIMEOUT = 5000;
`;
    const symbols = extractDocumentSymbols(code, "service.ts");
    expect(symbols).toEqual([
      { name: "UserConfig", kind: "interface", line: 2 },
      { name: "UserStatus", kind: "type", line: 6 },
      { name: "UserService", kind: "class", line: 8 },
      { name: "fetchUser", kind: "function", line: 12 },
      { name: "updateUser", kind: "function", line: 16 },
      { name: "DEFAULT_TIMEOUT", kind: "constant", line: 20 },
    ]);
  });

  it("extracts Python functions and classes", () => {
    const code = `
class AgentRunner:
    def execute(self):
        pass

def create_runner():
    return AgentRunner()
`;
    const symbols = extractDocumentSymbols(code, "runner.py");
    expect(symbols).toEqual([
      { name: "AgentRunner", kind: "class", line: 2 },
      { name: "execute", kind: "method", line: 3 },
      { name: "create_runner", kind: "function", line: 6 },
    ]);
  });

  it("extracts Go functions and types", () => {
    const code = `
type Server struct {
  port int
}

func StartServer() error {
  return nil
}
`;
    const symbols = extractDocumentSymbols(code, "server.go");
    expect(symbols).toEqual([
      { name: "Server", kind: "class", line: 2 },
      { name: "StartServer", kind: "function", line: 6 },
    ]);
  });
});
