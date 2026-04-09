import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trips")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trips")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return await ctx.db.insert("trips", {
      title: args.title,
      destination: args.destination,
      status: "draft",
      sortOrder: existing.length,
      workspaceId: args.workspaceId,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("trips"),
    status: v.union(
      v.literal("draft"),
      v.literal("planning"),
      v.literal("booked"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("trips")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { sortOrder: i });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
