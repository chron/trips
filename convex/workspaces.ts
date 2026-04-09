import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const email = identity.email ?? "";

    // Check if user already belongs to a workspace
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (membership) {
      return membership.workspaceId;
    }

    // Create a new workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "My Trips",
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      email,
      role: "owner",
    });

    return workspaceId;
  },
});

export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    return membership?.workspaceId ?? null;
  },
});
