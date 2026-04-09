import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-70 shrink-0 border-r border-border bg-muted flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-serif text-foreground tracking-tight">
            Trips
          </h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Trip list will go here */}
          <p className="text-sm text-muted-foreground">No trips yet</p>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
