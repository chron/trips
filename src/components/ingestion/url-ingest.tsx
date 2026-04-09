import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const categories = [
  "food",
  "activity",
  "hotel",
  "landmark",
  "transport",
  "other",
] as const;
type Category = (typeof categories)[number];

const categoryLabels: Record<Category, string> = {
  food: "Food",
  activity: "Activity",
  hotel: "Hotel",
  landmark: "Landmark",
  transport: "Transport",
  other: "Other",
};

type Extraction = {
  name: string;
  lat: number | null;
  lng: number | null;
  category: Category;
  notes: string;
  sourceUrl: string;
};

export function UrlIngest({
  tripId,
  onPinCreated,
}: {
  tripId: Id<"trips">;
  onPinCreated?: (coords: { lat: number; lng: number }) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<Extraction | null>(null);

  const extract = useAction(api.ingestion.extractFromUrl);
  const createPin = useMutation(api.pins.create);

  async function handleExtract() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setEditedResult(null);

    try {
      const data = await extract({ url: url.trim() });
      setEditedResult(data as Extraction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!editedResult) return;
    if (editedResult.lat === null || editedResult.lng === null) {
      setError("Could not determine location coordinates. Try editing the name or adding coordinates manually.");
      return;
    }

    await createPin({
      tripId,
      lat: editedResult.lat,
      lng: editedResult.lng,
      name: editedResult.name,
      category: editedResult.category,
      notes: editedResult.notes,
      sourceUrl: editedResult.sourceUrl,
      confirmed: true,
      createdBy: "url-ingest",
    });

    const coords = { lat: editedResult.lat, lng: editedResult.lng };
    toast.success(`Pin "${editedResult.name}" added`);
    setUrl("");
    setEditedResult(null);
    setError(null);
    onPinCreated?.(coords);
  }

  function handleCancel() {
    setEditedResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleExtract();
          }}
          placeholder="Paste a URL to extract a pin…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <button
          onClick={handleExtract}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Extracting…" : "Extract"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <span className="animate-pulse">Fetching and analyzing page…</span>
        </div>
      )}

      {/* Confirmation card */}
      {editedResult && !loading && (
        <div className="rounded-lg border border-border bg-card shadow-card p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <input
                value={editedResult.name}
                onChange={(e) =>
                  setEditedResult({ ...editedResult, name: e.target.value })
                }
                className="text-sm font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none pb-0.5 transition-colors"
              />
              <textarea
                value={editedResult.notes}
                onChange={(e) =>
                  setEditedResult({ ...editedResult, notes: e.target.value })
                }
                rows={2}
                className="text-xs text-muted-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded-md px-1 py-0.5 resize-none transition-colors"
              />
            </div>
            <select
              value={editedResult.category}
              onChange={(e) =>
                setEditedResult({
                  ...editedResult,
                  category: e.target.value as Category,
                })
              }
              className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </div>

          {editedResult.lat !== null && editedResult.lng !== null && (
            <p className="text-[10px] text-muted-foreground font-mono">
              {editedResult.lat.toFixed(5)}, {editedResult.lng.toFixed(5)}
            </p>
          )}
          {editedResult.lat === null && (
            <p className="text-[10px] text-amber-600">
              Could not determine coordinates — pin will not be placed on map
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={editedResult.lat === null}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Add pin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
