import { useState, type FormEvent } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";

const categories = [
  "food",
  "activity",
  "hotel",
  "landmark",
  "transport",
  "other",
] as const;

export function NewPinPanel({
  lat,
  lng,
  onConfirm,
  onCancel,
}: {
  lat: number;
  lng: number;
  onConfirm: (data: {
    name: string;
    category: Doc<"pins">["category"];
    notes?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Doc<"pins">["category"]>("other");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConfirm({
      name: name.trim() || "Untitled pin",
      category,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="w-80 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Add Pin</h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Cancel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What's here?"
            autoFocus
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Doc<"pins">["category"])}
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
            rows={2}
            placeholder="Optional notes…"
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Add pin
          </button>
        </div>
      </form>
    </div>
  );
}
