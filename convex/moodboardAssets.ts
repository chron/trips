import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAsset = mutation({
  args: {
    tripId: v.id("trips"),
    assetId: v.string(), // tldraw asset ID
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("moodboardAssets")
      .withIndex("by_asset", (q) =>
        q.eq("tripId", args.tripId).eq("assetId", args.assetId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { storageId: args.storageId });
    } else {
      await ctx.db.insert("moodboardAssets", {
        tripId: args.tripId,
        assetId: args.assetId,
        storageId: args.storageId,
      });
    }
  },
});

export const getAssetUrl = query({
  args: {
    tripId: v.id("trips"),
    assetId: v.string(),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("moodboardAssets")
      .withIndex("by_asset", (q) =>
        q.eq("tripId", args.tripId).eq("assetId", args.assetId),
      )
      .unique();

    if (!asset) return null;
    return await ctx.storage.getUrl(asset.storageId);
  },
});

export const getAssetUrls = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("moodboardAssets")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(200);

    const urls: Record<string, string> = {};
    for (const asset of assets) {
      const url = await ctx.storage.getUrl(asset.storageId);
      if (url) {
        urls[asset.assetId] = url;
      }
    }
    return urls;
  },
});
