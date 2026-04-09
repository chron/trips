import { LiveblocksProvider as LBProvider } from "@liveblocks/react";
import type { ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";

// Presence type shared across the app
export type Presence = {
  cursor: { x: number; y: number } | null;
  viewingTab: string | null;
  name: string;
  color: string;
  avatar: string;
};

export const CURSOR_COLORS = ["#C4654A", "#7C9A82", "#5B7FC4", "#D4923B"];

export function LiveblocksWrapper({ children }: { children: ReactNode }) {
  return (
    <LBProvider
      publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY as string}
    >
      {children}
    </LBProvider>
  );
}

export function usePresenceInfo() {
  const { user } = useUser();
  return {
    name: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Anonymous",
    avatar: user?.imageUrl ?? "",
  };
}
