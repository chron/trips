import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useWorkspaceId } from "../../lib/workspace";
import { Plus, X } from "lucide-react";

export function ThreadTabBar({
  activeThreadId,
  onSelectThread,
  tripId,
}: {
  activeThreadId: Id<"chatThreads"> | null;
  onSelectThread: (id: Id<"chatThreads">) => void;
  tripId?: Id<"trips">;
}) {
  const workspaceId = useWorkspaceId();
  const threads = useQuery(api.chat.listThreads, { workspaceId });
  const createThread = useMutation(api.chat.createThread);
  const deleteThread = useMutation(api.chat.deleteThread);

  const handleCreate = async () => {
    const id = await createThread({
      workspaceId,
      tripId,
      title: "New chat",
    });
    onSelectThread(id);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: Id<"chatThreads">,
  ) => {
    e.stopPropagation();
    await deleteThread({ id });
    // If we deleted the active thread, clear selection
    if (id === activeThreadId) {
      const remaining = threads?.filter((t) => t._id !== id);
      if (remaining?.length) {
        onSelectThread(remaining[0]._id);
      }
    }
  };

  return (
    <div className="flex items-center border-b border-border overflow-x-auto">
      {threads?.map((thread) => (
        <button
          key={thread._id}
          type="button"
          onClick={() => onSelectThread(thread._id)}
          className={`group flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            thread._id === activeThreadId
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="max-w-24 truncate">{thread.title}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => handleDelete(e, thread._id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDelete(e as unknown as React.MouseEvent, thread._id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-0.5"
          >
            <X className="h-3 w-3" />
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={handleCreate}
        className="flex items-center px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        title="New chat"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
