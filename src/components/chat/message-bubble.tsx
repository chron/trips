import type { UIMessage } from "ai";
import Markdown from "react-markdown";
import { ToolCallDisplay } from "./tool-call-display";

// In AI SDK v6, tool parts have type "tool-{toolName}" with input/output fields
interface ToolUIPart {
  type: string;
  toolCallId: string;
  state: string;
  input?: Record<string, unknown>;
  output?: unknown;
}

function isToolPart(part: { type: string }): part is ToolUIPart {
  return part.type.startsWith("tool-");
}

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text" && part.text) {
            return isUser ? (
              <p key={i} className="whitespace-pre-wrap">{part.text}</p>
            ) : (
              <div key={i} className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <Markdown>{part.text}</Markdown>
              </div>
            );
          }
          if (isToolPart(part)) {
            const toolName = part.type.replace(/^tool-/, "");
            return (
              <div key={i} className="my-1.5">
                <ToolCallDisplay
                  toolName={toolName}
                  args={part.input ?? {}}
                  result={part.output}
                  state={part.state}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
