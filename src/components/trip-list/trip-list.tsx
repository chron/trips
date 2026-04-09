import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { api } from "../../../convex/_generated/api";
import { useWorkspaceId } from "../../lib/workspace";
import { TripCard } from "./trip-card";
import { CreateTripDialog } from "./create-trip-dialog";

export function TripList() {
  const workspaceId = useWorkspaceId();
  const trips = useQuery(api.trips.list, { workspaceId });
  const reorder = useMutation(api.trips.reorder);
  const [showCreate, setShowCreate] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !trips) return;

    const oldIndex = trips.findIndex((t) => t._id === active.id);
    const newIndex = trips.findIndex((t) => t._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...trips];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorder({ ids: reordered.map((t) => t._id) });
  }

  if (!trips) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-3 shadow-card animate-pulse"
          >
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded mt-1.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {trips.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">
            No trips yet. Create one to get started!
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={trips.map((t) => t._id)}
              strategy={verticalListSortingStrategy}
            >
              {trips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        + New trip
      </button>

      {showCreate && <CreateTripDialog onClose={() => setShowCreate(false)} />}
    </>
  );
}
