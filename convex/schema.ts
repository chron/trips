import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trips: defineTable({
    title: v.string(),
    destination: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("planning"),
      v.literal("booked"),
    ),
    sortOrder: v.number(),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace", ["workspaceId", "sortOrder"]),

  pins: defineTable({
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
  }).index("by_trip", ["tripId"]),

  scratchpads: defineTable({
    tripId: v.optional(v.id("trips")),
    workspaceId: v.id("workspaces"),
    content: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_workspace_global", ["workspaceId", "tripId"]),

  moodboards: defineTable({
    tripId: v.id("trips"),
    snapshot: v.string(),
  }).index("by_trip", ["tripId"]),

  moodboardAssets: defineTable({
    tripId: v.id("trips"),
    assetId: v.string(), // tldraw asset ID
    storageId: v.id("_storage"),
  })
    .index("by_trip", ["tripId"])
    .index("by_asset", ["tripId", "assetId"]),

  chatThreads: defineTable({
    workspaceId: v.id("workspaces"),
    tripId: v.optional(v.id("trips")),
    title: v.string(),
  }).index("by_workspace", ["workspaceId"]),

  chatMessages: defineTable({
    threadId: v.id("chatThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          args: v.string(),
          result: v.optional(v.string()),
        }),
      ),
    ),
  }).index("by_thread", ["threadId"]),

  workspaces: defineTable({
    name: v.string(),
  }),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),
});
