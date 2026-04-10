import { useState } from "react";
import { ChevronRight, ChevronDown, Wrench } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  createTrip: "Create trip",
  updateTripStatus: "Update trip status",
  listTrips: "List trips",
  createPin: "Add pin",
  listPins: "List pins",
  removePin: "Remove pin",
  saveScratchpad: "Save scratchpad",
  getScratchpad: "Read scratchpad",
  navigateToTrip: "Navigate to trip",
};

export function ToolCallDisplay({
  toolName,
  args,
  result,
  state,
}: {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  state: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isLoading = state === "call" || state === "partial-call";

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-2">
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground">{label}</span>
        {isLoading && (
          <span className="text-muted-foreground animate-pulse">Running...</span>
        )}
        {!isLoading && result && (
          <span className="text-muted-foreground truncate">
            {formatBriefResult(result)}
          </span>
        )}
      </div>
      {expanded && (
        <div className="mt-2 space-y-2 pl-5">
          <div>
            <p className="text-muted-foreground mb-1">Input</p>
            <pre className="bg-background rounded p-2 overflow-x-auto whitespace-pre-wrap text-[11px]">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1">Result</p>
              <pre className="bg-background rounded p-2 overflow-x-auto whitespace-pre-wrap text-[11px]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function formatBriefResult(result: unknown): string {
  if (typeof result === "string") return result.slice(0, 60);
  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    if (obj.success) {
      const name = obj.name || obj.title || obj.status || "";
      return name ? `Done — ${name}` : "Done";
    }
    if (Array.isArray(result)) return `${result.length} items`;
  }
  return "";
}
