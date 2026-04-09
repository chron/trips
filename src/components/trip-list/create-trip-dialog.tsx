import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWorkspaceId } from "../../lib/workspace";

export function CreateTripDialog({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const createTrip = useMutation(api.trips.create);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    await createTrip({ title: title.trim(), destination: destination.trim(), workspaceId });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-serif text-foreground mb-4">New Trip</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-muted-foreground mb-1">
              Trip name
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer in Japan"
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="destination" className="block text-xs font-medium text-muted-foreground mb-1">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Tokyo, Kyoto, Osaka"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !destination.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
