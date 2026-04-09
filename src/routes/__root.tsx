import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { WorkspaceProvider } from "../lib/workspace";
import { LiveblocksWrapper } from "../lib/liveblocks";
import { TripList } from "../components/trip-list/trip-list";
import { ScratchpadEditor } from "../components/scratchpad/scratchpad-editor";

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
        <WorkspaceProvider>
          <LiveblocksWrapper>
            <AppShell />
          </LiveblocksWrapper>
        </WorkspaceProvider>
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
      <div className="text-center space-y-8 max-w-sm">
        <img
          src="/illustration.png"
          alt="A watercolor illustration of a travel planning scene"
          className="w-64 h-64 mx-auto rounded-2xl shadow-card object-cover"
        />
        <div className="space-y-2">
          <h1 className="text-4xl font-serif text-foreground">Trips</h1>
          <p className="text-muted-foreground text-sm">
            Plan your next adventure together.
          </p>
        </div>
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
  const [scratchpadOpen, setScratchpadOpen] = useState(false);

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
          <TripList />
        </nav>
        <div className="border-t border-border">
          <button
            onClick={() => setScratchpadOpen(!scratchpadOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Scratchpad</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              className={`transition-transform ${scratchpadOpen ? "rotate-180" : ""}`}
            >
              <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
            </svg>
          </button>
          {scratchpadOpen && (
            <div className="px-3 pb-3 max-h-60 overflow-y-auto">
              <ScratchpadEditor />
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
