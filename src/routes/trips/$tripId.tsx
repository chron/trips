import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { TripMap } from "../../components/trip-detail/trip-map";
import { PinList } from "../../components/trip-detail/pin-list";
import { ScratchpadEditor } from "../../components/scratchpad/scratchpad-editor";

const tabs = ["map", "pins", "notes"] as const;
type Tab = (typeof tabs)[number];

export const Route = createFileRoute("/trips/$tripId")({
  component: TripDetail,
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
    tab: tabs.includes(search.tab as Tab) ? (search.tab as Tab) : "map",
  }),
});

const statuses = ["draft", "planning", "booked"] as const;

function TripDetail() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const trip = useQuery(api.trips.get, {
    id: tripId as Id<"trips">,
  });
  const updateStatus = useMutation(api.trips.updateStatus);
  const removeTrip = useMutation(api.trips.remove);
  const { tab: activeTab } = Route.useSearch();

  function setActiveTab(tab: Tab) {
    navigate({
      to: "/trips/$tripId",
      params: { tripId },
      search: { tab },
      replace: true,
    });
  }

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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-serif text-foreground">{trip.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trip.destination}
            </p>
          </div>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex items-center gap-2">
          <StatusPicker
            status={trip.status}
            onChange={(status) =>
              updateStatus({ id: trip._id, status })
            }
          />
          <button
            onClick={async () => {
              if (confirm("Delete this trip?")) {
                await removeTrip({ id: trip._id });
                navigate({ to: "/trips" });
              }
            }}
            className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === "map" && <TripMap tripId={trip._id} />}
        {activeTab === "pins" && (
          <PinList
            tripId={trip._id}
            onSelectPin={() => setActiveTab("map")}
          />
        )}
        {activeTab === "notes" && (
          <div className="flex flex-col p-6 h-full">
            <ScratchpadEditor
              tripId={trip._id}
              className="flex-1 flex flex-col [&_.tiptap]:flex-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "map", label: "Map" },
    { id: "pins", label: "Pins" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
            active === tab.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
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
