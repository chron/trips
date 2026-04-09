import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SignInButton, UserButton } from "@clerk/clerk-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
      <Authenticated>
        <AppShell />
      </Authenticated>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}

function SignInScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-serif text-foreground">Trips</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Plan your next adventure together.
        </p>
        <SignInButton mode="modal">
          <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
            Sign in
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex h-screen">
      <aside className="w-70 shrink-0 border-r border-border bg-muted flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-2xl font-serif text-foreground tracking-tight">
            Trips
          </h1>
          <UserButton />
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground">No trips yet</p>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
