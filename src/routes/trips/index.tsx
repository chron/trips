import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trips/")({
  component: TripsPage,
});

function TripsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-6 max-w-xs">
        <img
          src="/illustration.png"
          alt=""
          className="w-48 h-48 mx-auto rounded-2xl object-cover opacity-80"
        />
        <p className="text-muted-foreground text-sm">
          Select a trip from the sidebar, or create a new one to get started.
        </p>
      </div>
    </div>
  );
}
