import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { SparklesIcon, CheckIcon, XIcon, ArrowRightIcon, CornerDownLeftIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { SelectedLineRange } from "@pierre/diffs";

export interface InlineCodeEditProps {
  readonly isOpen: boolean;
  readonly relativePath: string;
  readonly selectedRange: SelectedLineRange | null;
  readonly originalCode: string;
  readonly onClose: () => void;
  readonly onApplyEdit: (newContents: string) => void;
  readonly onSendToChat?: (instruction: string, selectedSnippet: string) => void;
}

const PRESET_PROMPTS = [
  "Add try/catch error handling",
  "Add TypeScript types & JSDoc",
  "Simplify and refactor logic",
  "Write unit test skeleton",
];

export function InlineCodeEdit({
  isOpen,
  relativePath,
  selectedRange,
  originalCode,
  onClose,
  onApplyEdit,
  onSendToChat,
}: InlineCodeEditProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedCode, setProposedCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProposedCode(null);
      setPrompt("");
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lines = originalCode.split("\n");
  const hasRange = selectedRange !== null;
  const startLine = hasRange ? Math.min(selectedRange.start, selectedRange.end) : 1;
  const endLine = hasRange ? Math.max(selectedRange.start, selectedRange.end) : lines.length;
  const selectedSnippet = lines.slice(startLine - 1, endLine).join("\n");

  const handleApplyPreset = (preset: string) => {
    setPrompt(preset);
    inputRef.current?.focus();
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    // Simulate smart code transformation with diff preview
    setTimeout(() => {
      let transformedSnippet = selectedSnippet;
      const lower = prompt.toLowerCase();

      if (lower.includes("error") || lower.includes("try") || lower.includes("catch")) {
        const indented = selectedSnippet
          .split("\n")
          .map((l) => `  ${l}`)
          .join("\n");
        transformedSnippet = `try {\n${indented}\n} catch (error) {\n  console.error("Error executing in ${relativePath}:", error);\n  throw error;\n}`;
      } else if (lower.includes("types") || lower.includes("doc") || lower.includes("jsdoc")) {
        transformedSnippet = `/**\n * @summary ${prompt}\n */\n${selectedSnippet}`;
      } else if (lower.includes("simplify") || lower.includes("refactor")) {
        transformedSnippet = `// Refactored: ${prompt}\n${selectedSnippet}`;
      } else if (lower.includes("test")) {
        transformedSnippet = `${selectedSnippet}\n\n// Test suite for above block\ndescribe("${relativePath}", () => {\n  it("should function as expected", () => {\n    // TODO: assert behavior\n  });\n});`;
      } else {
        transformedSnippet = `// [AI Edit: ${prompt}]\n${selectedSnippet}`;
      }

      const nextLines = [...lines];
      nextLines.splice(startLine - 1, endLine - startLine + 1, transformedSnippet);
      setProposedCode(nextLines.join("\n"));
      setIsGenerating(false);
    }, 400);
  };

  const handleAccept = () => {
    if (proposedCode !== null) {
      onApplyEdit(proposedCode);
    }
    onClose();
  };

  const handleSendToChat = () => {
    if (onSendToChat && prompt.trim()) {
      onSendToChat(prompt, selectedSnippet);
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (proposedCode) handleAccept();
      else handleGenerate();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl rounded-xl border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Inline Code Edit"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <SparklesIcon className="size-3.5" />
          <span>Inline Edit</span>
          <span className="rounded bg-accent/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            {hasRange ? `L${startLine}–L${endLine}` : "Whole file"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close inline edit"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe edit (e.g. 'wrap in try/catch', 'add types')..."
          className="w-full rounded-lg border border-border/70 bg-accent/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isGenerating}
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
          >
            <span>Run</span>
            <CornerDownLeftIcon className="size-2.5" />
          </Button>
        </div>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap items-center gap-1 mt-2">
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleApplyPreset(preset)}
            className="rounded-full border border-border/50 bg-accent/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Diff / Action Preview */}
      {proposedCode ? (
        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Edit ready to accept
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setProposedCode(null)}
              className="h-6 text-[11px]"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="xs"
              variant="default"
              onClick={handleAccept}
              className="h-6 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckIcon className="size-3" />
              Accept (Cmd+Enter)
            </Button>
          </div>
        </div>
      ) : (
        onSendToChat && (
          <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Press Enter to generate</span>
            <button
              type="button"
              onClick={handleSendToChat}
              disabled={!prompt.trim()}
              className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
            >
              <span>Or ask agent thread</span>
              <ArrowRightIcon className="size-2.5" />
            </button>
          </div>
        )
      )}
    </div>
  );
}
