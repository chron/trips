import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tldraw, type Editor, type TLAssetStore, type TLAsset } from "tldraw";
import "tldraw/tldraw.css";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSaveIndicator } from "../save-indicator";

/**
 * Build a TLAssetStore that persists images in Convex file storage.
 * - upload: sends the file to Convex storage, saves asset→storageId mapping
 * - resolve: looks up the Convex storage URL for a given asset
 */
function useConvexAssetStore(tripId: Id<"trips">): TLAssetStore {
  const convex = useConvex();
  const generateUploadUrl = useMutation(api.moodboardAssets.generateUploadUrl);
  const saveAsset = useMutation(api.moodboardAssets.saveAsset);
  const assetUrls = useQuery(api.moodboardAssets.getAssetUrls, { tripId });

  // Keep a mutable ref to the latest URL map so resolve() always sees fresh data
  const urlsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (assetUrls) urlsRef.current = assetUrls;
  });

  // Stable refs for mutations so the store object doesn't change identity
  const generateUploadUrlRef = useRef(generateUploadUrl);
  const saveAssetRef = useRef(saveAsset);
  useEffect(() => {
    generateUploadUrlRef.current = generateUploadUrl;
    saveAssetRef.current = saveAsset;
  });

  return useMemo(
    (): TLAssetStore => ({
      async upload(asset: TLAsset, file: File) {
        // Get a short-lived upload URL from Convex
        const uploadUrl = await generateUploadUrlRef.current();

        // Upload the file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = (await result.json()) as {
          storageId: Id<"_storage">;
        };

        // Save the tldraw assetId → Convex storageId mapping
        await saveAssetRef.current({
          tripId,
          assetId: asset.id,
          storageId,
        });

        // Get the serving URL
        const url = await convex.query(api.moodboardAssets.getAssetUrl, {
          tripId,
          assetId: asset.id,
        });

        return { src: url ?? "" };
      },

      resolve(asset: TLAsset) {
        // Check our cached URL map first (avoids async query per asset)
        const cached = urlsRef.current[asset.id];
        if (cached) return cached;
        // Fall back to whatever src was stored in the snapshot
        return asset.props.src ?? null;
      },
    }),
    [tripId, convex],
  );
}

/**
 * Inner component that mounts tldraw exactly once.
 * Uses useState initializer to capture the snapshot on first render only —
 * subsequent Convex query updates (from our own saves) are ignored so the
 * canvas never remounts.
 */
function MoodboardCanvas({
  tripId,
  snapshotJson,
  className,
}: {
  tripId: Id<"trips">;
  snapshotJson: string | null;
  className: string;
}) {
  const saveMoodboard = useMutation(api.moodboards.save);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveMoodboardRef = useRef(saveMoodboard);
  const { markUnsaved, markSaving, markSaved } = useSaveIndicator();
  const saveIndicatorRef = useRef({ markUnsaved, markSaving, markSaved });

  useEffect(() => {
    saveMoodboardRef.current = saveMoodboard;
    saveIndicatorRef.current = { markUnsaved, markSaving, markSaved };
  });

  // Parse once on mount — ignore all future prop changes
  const [initialSnapshot] = useState(() =>
    snapshotJson ? JSON.parse(snapshotJson) : undefined,
  );

  const assets = useConvexAssetStore(tripId);

  const handleMount = useCallback(
    (editor: Editor) => {
      // Listen for ALL document changes (not just source:"user")
      // so text edits, image uploads, and other operations trigger saves
      const unsub = editor.store.listen(
        () => {
          saveIndicatorRef.current.markUnsaved();
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(async () => {
            const snapshot = JSON.stringify(editor.getSnapshot());
            saveIndicatorRef.current.markSaving();
            await saveMoodboardRef.current({ tripId, snapshot });
            saveIndicatorRef.current.markSaved();
          }, 1000);
        },
        { scope: "document" },
      );

      return () => {
        unsub();
        clearTimeout(saveTimeoutRef.current);
      };
    },
    [tripId],
  );

  return (
    <div className={`h-full ${className}`}>
      <Tldraw
        snapshot={initialSnapshot}
        onMount={handleMount}
        assets={assets}
        options={{ maxPages: 1 }}
      />
    </div>
  );
}

export function MoodboardEditor({
  tripId,
  className = "",
}: {
  tripId: Id<"trips">;
  className?: string;
}) {
  const moodboard = useQuery(api.moodboards.get, { tripId });

  // Wait for the query to resolve before rendering
  if (moodboard === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading mood board…</p>
      </div>
    );
  }

  // Pass raw JSON string so the canvas can parse it once in useState initializer
  return (
    <MoodboardCanvas
      tripId={tripId}
      snapshotJson={moodboard?.snapshot ?? null}
      className={className}
    />
  );
}
