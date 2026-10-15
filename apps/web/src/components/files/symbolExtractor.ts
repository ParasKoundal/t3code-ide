export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "constant"
  | "method"
  | "enum";

export interface DocumentSymbol {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly line: number; // 1-indexed
  readonly detail?: string;
}

export function extractDocumentSymbols(
  contents: string,
  filePath: string,
): readonly DocumentSymbol[] {
  if (!contents) return [];
  const lines = contents.split("\n");
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const symbols: DocumentSymbol[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNumber = i + 1;
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("/*")
    ) {
      continue;
    }

    if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") {
      // Classes
      const classMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/);
      if (classMatch) {
        symbols.push({ name: classMatch[1]!, kind: "class", line: lineNumber });
        continue;
      }

      // Interfaces
      const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
      if (ifaceMatch) {
        symbols.push({ name: ifaceMatch[1]!, kind: "interface", line: lineNumber });
        continue;
      }

      // Types
      const typeMatch = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z0-9_$]+)/);
      if (typeMatch) {
        symbols.push({ name: typeMatch[1]!, kind: "type", line: lineNumber });
        continue;
      }

      // Enums
      const enumMatch = trimmed.match(/^(?:export\s+)?enum\s+([A-Za-z0-9_$]+)/);
      if (enumMatch) {
        symbols.push({ name: enumMatch[1]!, kind: "enum", line: lineNumber });
        continue;
      }

      // Functions
      const fnMatch = trimmed.match(
        /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function(?:\s+([A-Za-z0-9_$]+)|\*?\s*\(|\s+)/,
      );
      if (fnMatch && fnMatch[1]) {
        symbols.push({ name: fnMatch[1], kind: "function", line: lineNumber });
        continue;
      }

      // Arrow functions / const declarations
      const arrowMatch = trimmed.match(
        /^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/,
      );
      if (arrowMatch) {
        symbols.push({ name: arrowMatch[1]!, kind: "function", line: lineNumber });
        continue;
      }

      // Constants
      const constMatch = trimmed.match(/^(?:export\s+)?const\s+([A-Za-z0-9_$]+)/);
      if (constMatch) {
        symbols.push({ name: constMatch[1]!, kind: "constant", line: lineNumber });
        continue;
      }
    } else if (ext === ".py") {
      // Python functions & classes
      const pyClass = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
      if (pyClass) {
        symbols.push({ name: pyClass[1]!, kind: "class", line: lineNumber });
        continue;
      }
      const pyDef = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)/);
      if (pyDef) {
        const isMethod = line.startsWith("  ") || line.startsWith("\t");
        symbols.push({ name: pyDef[1]!, kind: isMethod ? "method" : "function", line: lineNumber });
        continue;
      }
    } else if (ext === ".go") {
      // Go functions & methods
      const goFunc = trimmed.match(/^func\s+(?:\([^)]+\)\s+)?([A-Za-z0-9_]+)/);
      if (goFunc) {
        symbols.push({ name: goFunc[1]!, kind: "function", line: lineNumber });
        continue;
      }
      const goType = trimmed.match(/^type\s+([A-Za-z0-9_]+)\s+(?:struct|interface)/);
      if (goType) {
        symbols.push({ name: goType[1]!, kind: "class", line: lineNumber });
        continue;
      }
    } else if (ext === ".rs") {
      // Rust functions, structs, enums
      const rsFn = trimmed.match(/^(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/);
      if (rsFn) {
        symbols.push({ name: rsFn[1]!, kind: "function", line: lineNumber });
        continue;
      }
      const rsStruct = trimmed.match(/^(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z0-9_]+)/);
      if (rsStruct) {
        symbols.push({ name: rsStruct[1]!, kind: "class", line: lineNumber });
        continue;
      }
    }
  }

  return symbols;
}
