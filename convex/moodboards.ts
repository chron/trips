import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("moodboards")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .unique();
  },
});

export const save = mutation({
  args: {
    tripId: v.id("trips"),
    snapshot: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("moodboards")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { snapshot: args.snapshot });
    } else {
      await ctx.db.insert("moodboards", {
        tripId: args.tripId,
        snapshot: args.snapshot,
      });
    }
  },
});
