import { useCallback, useRef } from "react";
import { Tldraw, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function MoodboardEditor({
  tripId,
  className = "",
}: {
  tripId: Id<"trips">;
  className?: string;
}) {
  const moodboard = useQuery(api.moodboards.get, { tripId });
  const saveMoodboard = useMutation(api.moodboards.save);
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSavedRef = useRef<string>("");

  const debouncedSave = useCallback(
    (editor: Editor) => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const snapshot = JSON.stringify(editor.getSnapshot());
        if (snapshot !== lastSavedRef.current) {
          lastSavedRef.current = snapshot;
          saveMoodboard({ tripId, snapshot });
        }
      }, 1000);
    },
    [tripId, saveMoodboard],
  );

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Listen for any store changes and debounce save
      const unsub = editor.store.listen(
        () => debouncedSave(editor),
        { source: "user", scope: "document" },
      );

      return () => {
        unsub();
        clearTimeout(saveTimeoutRef.current);
      };
    },
    [debouncedSave],
  );

  // Wait for the query to resolve before rendering
  if (moodboard === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading mood board…</p>
      </div>
    );
  }

  // Parse existing snapshot or use undefined for a blank canvas
  const snapshot = moodboard?.snapshot
    ? JSON.parse(moodboard.snapshot)
    : undefined;

  return (
    <div className={`h-full ${className}`}>
      <Tldraw
        snapshot={snapshot}
        onMount={handleMount}
        options={{ maxPages: 1 }}
      />
    </div>
  );
}
