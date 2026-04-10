import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

export const listThreads = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatThreads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(50);
  },
});

export const getThread = query({
  args: { id: v.id("chatThreads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createThread = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    tripId: v.optional(v.id("trips")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatThreads", {
      workspaceId: args.workspaceId,
      tripId: args.tripId,
      title: args.title,
    });
  },
});

export const deleteThread = mutation({
  args: { id: v.id("chatThreads") },
  handler: async (ctx, args) => {
    // Delete all messages in the thread first
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const updateThreadTitle = mutation({
  args: { id: v.id("chatThreads"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const listMessages = query({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .take(200);
  },
});

const toolCallValidator = v.object({
  id: v.string(),
  name: v.string(),
  args: v.string(),
  result: v.optional(v.string()),
});

// Internal mutation — called from the HTTP streaming action
export const addMessage = internalMutation({
  args: {
    threadId: v.id("chatThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    toolCalls: v.optional(v.array(toolCallValidator)),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
    });
  },
});

// Public mutation — called from the client to save user messages
export const addUserMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      threadId: args.threadId,
      role: "user",
      content: args.content,
    });
  },
});
