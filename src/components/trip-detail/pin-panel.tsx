import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const categories = [
  "food",
  "activity",
  "hotel",
  "landmark",
  "transport",
  "other",
] as const;

export function PinPanel({
  pin,
  onClose,
  onFlyTo,
}: {
  pin: Doc<"pins">;
  onClose: () => void;
  onFlyTo: () => void;
}) {
  const updatePin = useMutation(api.pins.update);
  const removePin = useMutation(api.pins.remove);
  const [name, setName] = useState(pin.name);
  const [notes, setNotes] = useState(pin.notes ?? "");
  const [sourceUrl, setSourceUrl] = useState(pin.sourceUrl ?? "");
  const [category, setCategory] = useState(pin.category);

  // Reset state when pin changes
  if (pin.name !== name && name === "") setName(pin.name);

  function save() {
    updatePin({
      id: pin._id,
      name: name.trim() || "Untitled pin",
      category,
      notes: notes.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    });
  }

  return (
    <div className="w-80 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onFlyTo}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          Fly to pin
        </button>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              const val = e.target.value as Doc<"pins">["category"];
              setCategory(val);
              updatePin({ id: pin._id, name, category: val, notes: notes || undefined, sourceUrl: sourceUrl || undefined });
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={save}
            rows={3}
            placeholder="Add notes…"
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Source URL
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            onBlur={save}
            placeholder="https://…"
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
          </span>
          <button
            onClick={() => {
              removePin({ id: pin._id });
              onClose();
            }}
            className="text-destructive hover:underline cursor-pointer"
          >
            Delete pin
          </button>
        </div>
      </div>
    </div>
  );
}
