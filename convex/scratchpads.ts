import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getForTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scratchpads")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .first();
  },
});

export const getGlobal = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scratchpads")
      .withIndex("by_workspace_global", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("tripId", undefined),
      )
      .first();
  },
});

export const save = mutation({
  args: {
    tripId: v.optional(v.id("trips")),
    workspaceId: v.id("workspaces"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.tripId) {
      const existing = await ctx.db
        .query("scratchpads")
        .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { content: args.content });
        return existing._id;
      }
    } else {
      const existing = await ctx.db
        .query("scratchpads")
        .withIndex("by_workspace_global", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("tripId", undefined),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { content: args.content });
        return existing._id;
      }
    }

    return await ctx.db.insert("scratchpads", {
      tripId: args.tripId,
      workspaceId: args.workspaceId,
      content: args.content,
    });
  },
});
