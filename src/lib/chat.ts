import { useAuth } from "@clerk/clerk-react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useWorkspaceId } from "./workspace";
import { useRef, useEffect, useCallback } from "react";

/** Derive the Convex .site URL from the .cloud URL in env */
const chatApiUrl = (() => {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
  return convexUrl.replace(/\.cloud$/, ".site") + "/api/chat";
})();

// Module-level mutable state that the transport's async callbacks close over.
// Updated by the hook on each render via useEffect.
const dynamicState = {
  getToken: null as null | ((opts?: { template?: string }) => Promise<string | null>),
  threadId: null as string | null,
  workspaceId: null as string | null,
  tripId: undefined as string | undefined,
};

// Single stable transport instance — never recreated
const transport = new DefaultChatTransport({
  api: chatApiUrl,
  headers: async () => {
    const token = await dynamicState.getToken?.();
    return { Authorization: `Bearer ${token}` };
  },
  body: () => ({
    threadId: dynamicState.threadId,
    workspaceId: dynamicState.workspaceId,
    tripId: dynamicState.tripId,
  }),
});

function persistedToUIMessages(
  messages: Array<{
    _id: string;
    role: "user" | "assistant";
    content: string;
    toolCalls?: Array<{
      id: string;
      name: string;
      args: string;
      result?: string;
    }>;
  }>,
): UIMessage[] {
  return messages.map((msg) => {
    const parts: UIMessage["parts"] = [];

    if (msg.toolCalls?.length) {
      for (const tc of msg.toolCalls) {
        parts.push({
          type: "tool-invocation",
          toolInvocation: {
            toolCallId: tc.id,
            toolName: tc.name,
            args: JSON.parse(tc.args),
            state: "result" as const,
            result: tc.result ? JSON.parse(tc.result) : undefined,
          },
        });
      }
    }

    if (msg.content) {
      parts.push({ type: "text", text: msg.content });
    }

    return { id: msg._id, role: msg.role, parts };
  });
}

export function useTripChat({
  threadId,
  tripId,
}: {
  threadId: Id<"chatThreads"> | null;
  tripId?: Id<"trips">;
}) {
  const workspaceId = useWorkspaceId();
  const { getToken } = useAuth();
  const addUserMessage = useMutation(api.chat.addUserMessage);

  // Keep module-level state in sync
  useEffect(() => { dynamicState.getToken = getToken; }, [getToken]);
  useEffect(() => { dynamicState.threadId = threadId; }, [threadId]);
  useEffect(() => { dynamicState.workspaceId = workspaceId; }, [workspaceId]);
  useEffect(() => { dynamicState.tripId = tripId; }, [tripId]);

  // Load persisted messages from Convex
  const persistedMessages = useQuery(
    api.chat.listMessages,
    threadId ? { threadId } : "skip",
  );

  const { messages, status, error, sendMessage, setMessages } = useAIChat({
    id: threadId ?? "no-thread",
    transport,
  });

  // Seed messages from Convex when thread changes or persisted messages load
  const seededThreadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!threadId || !persistedMessages) return;
    if (seededThreadRef.current === threadId) return;
    seededThreadRef.current = threadId;

    if (persistedMessages.length > 0) {
      setMessages(persistedToUIMessages(persistedMessages));
    } else {
      setMessages([]);
    }
  }, [threadId, persistedMessages, setMessages]);

  // Persist user messages to Convex before sending
  const send = useCallback(
    async (content: string) => {
      if (!threadId || !content.trim()) return;
      await addUserMessage({ threadId, content: content.trim() });
      sendMessage({ text: content.trim() });
    },
    [threadId, addUserMessage, sendMessage],
  );

  return {
    messages,
    status,
    error,
    sendMessage: send,
  };
}
