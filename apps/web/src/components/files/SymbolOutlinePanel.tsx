import { useState } from "react";
import { ChevronRightIcon, SearchIcon, Code2Icon } from "lucide-react";
import { cn } from "~/lib/utils";
import type { DocumentSymbol, SymbolKind } from "./symbolExtractor";

export interface SymbolOutlinePanelProps {
  readonly symbols: readonly DocumentSymbol[];
  readonly onSelectSymbol: (symbol: DocumentSymbol) => void;
  readonly defaultCollapsed?: boolean;
}

function symbolKindBadge(kind: SymbolKind) {
  switch (kind) {
    case "function":
    case "method":
      return { label: "ƒ", color: "text-purple-500 bg-purple-500/10" };
    case "class":
      return { label: "C", color: "text-amber-500 bg-amber-500/10" };
    case "interface":
      return { label: "I", color: "text-cyan-500 bg-cyan-500/10" };
    case "type":
      return { label: "T", color: "text-blue-500 bg-blue-500/10" };
    case "enum":
      return { label: "E", color: "text-emerald-500 bg-emerald-500/10" };
    case "constant":
    case "variable":
    default:
      return { label: "v", color: "text-slate-400 bg-slate-500/10" };
  }
}

export function SymbolOutlinePanel({
  symbols,
  onSelectSymbol,
  defaultCollapsed = false,
}: SymbolOutlinePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [filter, setFilter] = useState("");

  if (symbols.length === 0) return null;

  const filtered = filter.trim()
    ? symbols.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
    : symbols;

  return (
    <div className="flex flex-col border-t border-border/60 bg-background/50">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-7 w-full items-center justify-between px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent/40"
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-semibold">
          <ChevronRightIcon
            className={cn("size-3 transition-transform", !collapsed && "rotate-90")}
          />
          <Code2Icon className="size-3" />
          <span>Outline</span>
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/70">{symbols.length}</span>
      </button>

      {!collapsed && (
        <div className="flex flex-col max-h-48 overflow-y-auto px-1.5 pb-2">
          {symbols.length > 8 && (
            <div className="relative my-1 px-1">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter symbols..."
                className="w-full rounded border border-border/60 bg-accent/20 px-2 py-0.5 text-[11px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <ul className="flex flex-col gap-0.5">
            {filtered.map((symbol) => {
              const badge = symbolKindBadge(symbol.kind);
              return (
                <li key={`${symbol.name}:${symbol.line}`}>
                  <button
                    type="button"
                    onClick={() => onSelectSymbol(symbol)}
                    className="group flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent/60"
                  >
                    <span className="flex items-center gap-2 min-w-0 truncate">
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold",
                          badge.color,
                        )}
                      >
                        {badge.label}
                      </span>
                      <span className="truncate text-foreground/90 font-mono text-[11px]">
                        {symbol.name}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      :{symbol.line}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
