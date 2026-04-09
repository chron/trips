import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/trips/$tripId")({
  component: TripDetail,
});

const statuses = ["draft", "planning", "booked"] as const;

function TripDetail() {
  const { tripId } = Route.useParams();
  const trip = useQuery(api.trips.get, {
    id: tripId as Id<"trips">,
  });
  const updateStatus = useMutation(api.trips.updateStatus);
  const removeTrip = useMutation(api.trips.remove);

  if (trip === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-foreground">{trip.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPicker
            status={trip.status}
            onChange={(status) =>
              updateStatus({ id: trip._id, status })
            }
          />
          <button
            onClick={() => {
              if (confirm("Delete this trip?")) {
                removeTrip({ id: trip._id });
                window.history.back();
              }
            }}
            className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 shadow-card text-center">
        <p className="text-muted-foreground text-sm">
          Map and pins coming soon…
        </p>
      </div>
    </div>
  );
}

function StatusPicker({
  status,
  onChange,
}: {
  status: Doc<"trips">["status"];
  onChange: (status: Doc<"trips">["status"]) => void;
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Doc<"trips">["status"])}
      className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}
