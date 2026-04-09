import { useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWorkspaceId } from "../../lib/workspace";
import { RichTextEditor } from "../editor/rich-text-editor";
import type { Id } from "../../../convex/_generated/dataModel";

export function ScratchpadEditor({
  tripId,
  className = "",
}: {
  tripId?: Id<"trips">;
  className?: string;
}) {
  const workspaceId = useWorkspaceId();
  const tripScratchpad = useQuery(
    api.scratchpads.getForTrip,
    tripId ? { tripId } : "skip",
  );
  const globalScratchpad = useQuery(
    api.scratchpads.getGlobal,
    tripId ? "skip" : { workspaceId },
  );
  const scratchpad = tripId ? tripScratchpad : globalScratchpad;
  const save = useMutation(api.scratchpads.save);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const lastSaved = useRef("");

  const debouncedSave = useCallback(
    (html: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (html !== lastSaved.current) {
          lastSaved.current = html;
          save({ tripId, workspaceId, content: html });
        }
      }, 500);
    },
    [tripId, workspaceId, save],
  );

  const content = scratchpad?.content ?? "";

  return (
    <RichTextEditor
      content={content}
      onUpdate={debouncedSave}
      placeholder={
        tripId
          ? "Drop ideas, links, notes…"
          : "Dump half-formed thoughts, travel deals, inspiration…"
      }
      className={className}
    />
  );
}
