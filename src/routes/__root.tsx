import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { createRootRoute, Outlet, useMatch } from "@tanstack/react-router";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { WorkspaceProvider } from "../lib/workspace";
import { LiveblocksWrapper } from "../lib/liveblocks";
import { Toaster } from "sonner";
import { ErrorBoundary } from "../components/error-boundary";
import { HotkeyProvider } from "../lib/hotkeys";
import { TripList } from "../components/trip-list/trip-list";
import { ScratchpadEditor } from "../components/scratchpad/scratchpad-editor";
import { ChatSidebar } from "../components/chat/chat-sidebar";
import { MembersDialog } from "../components/workspace/members-dialog";
import { MessageCircle, Users } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

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
            <HotkeyProvider>
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    fontSize: "13px",
                  },
                }}
              />
            </HotkeyProvider>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  // Get active trip ID from route if on a trip page
  const tripMatch = useMatch({ from: "/trips/$tripId", shouldThrow: false });
  const activeTripId = tripMatch?.params?.tripId as Id<"trips"> | undefined;

  // Close sidebar on navigation (mobile)
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Keyboard shortcut: Escape to close sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-lg bg-card border border-border p-2 shadow-card md:hidden cursor-pointer"
        aria-label="Open sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-70 shrink-0 border-r border-border bg-muted flex flex-col transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-2xl font-serif text-foreground tracking-tight">
            Trips
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Workspace members"
            >
              <Users className="h-4 w-4" />
            </button>
            <UserButton />
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto" onClick={closeSidebar}>
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
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Chat sidebar */}
      <ChatSidebar
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        tripId={activeTripId}
      />

      {/* Chat toggle button */}
      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
          title="Open AI assistant"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Members dialog */}
      {membersOpen && <MembersDialog onClose={() => setMembersOpen(false)} />}
    </div>
  );
}
