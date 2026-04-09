import { useEffect, useRef, type ReactNode } from "react";
import { RoomProvider, useUpdateMyPresence } from "@liveblocks/react";
import { usePresenceInfo, CURSOR_COLORS } from "../../lib/liveblocks";
import { useUser } from "@clerk/clerk-react";

export function TripRoom({
  tripId,
  children,
}: {
  tripId: string;
  children: ReactNode;
}) {
  const { name, avatar } = usePresenceInfo();
  const { user } = useUser();

  // Stable color per user based on their ID
  const colorIndex = user?.id
    ? user.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      CURSOR_COLORS.length
    : 0;

  return (
    <RoomProvider
      id={`trip-${tripId}`}
      initialPresence={{
        cursor: null,
        viewingTab: "map",
        name,
        avatar,
        color: CURSOR_COLORS[colorIndex],
      }}
    >
      {children}
    </RoomProvider>
  );
}

export function CursorTracker({ children }: { children: ReactNode }) {
  const updatePresence = useUpdateMyPresence();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handlePointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      updatePresence({
        cursor: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      });
    }

    function handlePointerLeave() {
      updatePresence({ cursor: null });
    }

    // Use capture phase to get events even if the map stops propagation
    el.addEventListener("pointermove", handlePointerMove, { capture: true });
    el.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      el.removeEventListener("pointermove", handlePointerMove, { capture: true });
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [updatePresence]);

  return (
    <div ref={containerRef} className="relative h-full">
      {children}
    </div>
  );
}
