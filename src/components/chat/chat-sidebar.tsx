import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useTripChat } from "../../lib/chat";
import { ThreadTabBar } from "./thread-tab-bar";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

export function ChatSidebar({
  open,
  onClose,
  tripId,
}: {
  open: boolean;
  onClose: () => void;
  tripId?: Id<"trips">;
}) {
  const [activeThreadId, setActiveThreadId] =
    useState<Id<"chatThreads"> | null>(null);
  const navigate = useNavigate();

  const { messages, status, sendMessage } = useTripChat({
    threadId: activeThreadId,
    tripId,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Watch for navigateToTrip tool results and auto-navigate
  const lastNavRef = useRef<string | null>(null);
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (
          part.type === "tool-navigateToTrip" &&
          "output" in part &&
          part.output
        ) {
          const output = part.output as { action?: string; tripId?: string };
          if (
            output.action === "navigate" &&
            output.tripId &&
            output.tripId !== lastNavRef.current
          ) {
            lastNavRef.current = output.tripId;
            navigate({ to: "/trips/$tripId", params: { tripId: output.tripId } });
          }
        }
      }
    }
  }, [messages, navigate]);

  if (!open) return null;

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Thread tabs */}
      <ThreadTabBar
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        tripId={tripId}
      />

      {/* Messages */}
      {activeThreadId ? (
        <>
          <MessageList messages={messages} isStreaming={isStreaming} />
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-muted-foreground text-sm text-center">
            Create a new chat thread to get started.
          </p>
        </div>
      )}
    </div>
  );
}
