import { useOthers, useSelf } from "@liveblocks/react";

export function PresenceAvatars() {
  const self = useSelf();
  const others = useOthers();

  return (
    <div className="flex items-center -space-x-2">
      {others.map((other) => (
        <Avatar
          key={other.connectionId}
          name={other.presence?.name as string ?? "?"}
          avatar={other.presence?.avatar as string}
          color={other.presence?.color as string ?? "#8A8279"}
        />
      ))}
      {self && (
        <Avatar
          name={self.presence?.name as string ?? "You"}
          avatar={self.presence?.avatar as string}
          color={self.presence?.color as string ?? "#C4654A"}
          isSelf
        />
      )}
    </div>
  );
}

function Avatar({
  name,
  avatar,
  color,
  isSelf = false,
}: {
  name: string;
  avatar?: string;
  color: string;
  isSelf?: boolean;
}) {
  const label = isSelf ? `${name} (you)` : name;
  return (
    <div className="group relative">
      <div
        className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-medium text-white overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {avatar ? (
          <img src={avatar} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-[10px] text-background whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </div>
    </div>
  );
}
