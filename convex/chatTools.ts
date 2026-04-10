/**
 * Internal wrappers for agent tool calls.
 * These are called from the HTTP streaming action via ctx.runMutation/ctx.runQuery.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// --- Trips ---

export const listTrips = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trips")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getTrip = internalQuery({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createTrip = internalMutation({
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

    const id = await ctx.db.insert("trips", {
      title: args.title,
      destination: args.destination,
      status: "draft",
      sortOrder: existing.length,
      workspaceId: args.workspaceId,
    });
    return id;
  },
});

export const updateTripStatus = internalMutation({
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

// --- Pins ---

export const listPins = internalQuery({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pins")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const createPin = internalMutation({
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("pins", {
      ...args,
      confirmed: true,
      createdBy: "ai-agent",
    });
    return id;
  },
});

export const updatePin = internalMutation({
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
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const removePin = internalMutation({
  args: { id: v.id("pins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Scratchpads ---

export const getScratchpad = internalQuery({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const pad = await ctx.db
      .query("scratchpads")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .first();
    return pad?.content ?? "";
  },
});

export const saveScratchpad = internalMutation({
  args: {
    tripId: v.id("trips"),
    workspaceId: v.id("workspaces"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scratchpads")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content });
    } else {
      await ctx.db.insert("scratchpads", {
        tripId: args.tripId,
        workspaceId: args.workspaceId,
        content: args.content,
      });
    }
  },
});

// --- Chat thread helpers ---

export const countMessages = internalQuery({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    return messages.length;
  },
});

export const updateThreadTitle = internalMutation({
  args: { id: v.id("chatThreads"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});
