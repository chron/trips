import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

const categoryColors: Record<string, string> = {
  food: "bg-pin-food",
  activity: "bg-pin-activity",
  hotel: "bg-pin-hotel",
  landmark: "bg-pin-landmark",
  transport: "bg-pin-transport",
  other: "bg-pin-other",
};

export function PinList({
  tripId,
  onSelectPin,
}: {
  tripId: Id<"trips">;
  onSelectPin: (pinId: Id<"pins">) => void;
}) {
  const pins = useQuery(api.pins.list, { tripId });
  const removePin = useMutation(api.pins.remove);

  if (!pins) return null;

  if (pins.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No pins yet. Switch to the map to drop some!
        </p>
      </div>
    );
  }

  const grouped = groupByCategory(pins);

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {grouped.map(([category, categoryPins]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${categoryColors[category] ?? categoryColors.other}`}
            />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {categoryPins.length}
            </span>
          </div>
          <div className="space-y-1">
            {categoryPins.map((pin) => (
              <div
                key={pin._id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectPin(pin._id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pin.name}
                  </p>
                  {pin.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {pin.notes}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {pin.sourceUrl && (
                    <a
                      href={pin.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Open source"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
                        <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePin({ id: pin._id });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all cursor-pointer"
                    title="Delete pin"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByCategory(pins: Doc<"pins">[]) {
  const order = ["food", "activity", "hotel", "landmark", "transport", "other"];
  const groups = new Map<string, Doc<"pins">[]>();

  for (const pin of pins) {
    const list = groups.get(pin.category) ?? [];
    list.push(pin);
    groups.set(pin.category, list);
  }

  return order
    .filter((c) => groups.has(c))
    .map((c) => [c, groups.get(c)!] as const);
}
