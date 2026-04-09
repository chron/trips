import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pins")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    lat: v.number(),
    lng: v.number(),
    name: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("activity"),
      v.literal("hotel"),
      v.literal("landmark"),
      v.literal("transport"),
      v.literal("other"),
    ),
    notes: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    confirmed: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pins", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("pins"),
    name: v.string(),
    category: v.union(
      v.literal("food"),
      v.literal("activity"),
      v.literal("hotel"),
      v.literal("landmark"),
      v.literal("transport"),
      v.literal("other"),
    ),
    notes: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("pins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
