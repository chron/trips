import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trips/")({
  component: TripsPage,
});

function TripsPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-serif text-foreground mb-4">Your Trips</h2>
      <div className="rounded-lg border border-border bg-card p-8 shadow-card text-center">
        <p className="text-muted-foreground text-sm">
          No trips yet. Create your first trip to get started.
        </p>
      </div>
    </div>
  );
}
