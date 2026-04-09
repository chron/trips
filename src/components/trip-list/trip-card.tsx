import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import type { Doc } from "../../../convex/_generated/dataModel";

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  planning: "bg-primary/10 text-primary",
  booked: "bg-secondary/10 text-secondary",
} as const;

export function TripCard({ trip }: { trip: Doc<"trips"> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trip._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-md ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <Link
          to="/trips/$tripId"
          params={{ tripId: trip._id }}
          search={{ tab: "map" }}
          className="flex-1 min-w-0"
        >
          <p className="text-sm font-medium text-foreground truncate">
            {trip.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {trip.destination}
          </p>
        </Link>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[trip.status]}`}
        >
          {trip.status}
        </span>
      </div>
    </div>
  );
}
