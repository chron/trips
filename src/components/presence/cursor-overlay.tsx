import { useOthers } from "@liveblocks/react";

export function CursorOverlay() {
  const others = useOthers();

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence?.cursor as
          | { x: number; y: number }
          | null
          | undefined;
        if (!cursor) return null;

        const name = (other.presence?.name as string) ?? "?";
        const color = (other.presence?.color as string) ?? "#7C9A82";

        return (
          <div
            key={other.connectionId}
            className="absolute transition-transform duration-75"
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
            >
              <path
                d="M0.5 0.5L15.5 10.5L7.5 12L4 19.5L0.5 0.5Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
