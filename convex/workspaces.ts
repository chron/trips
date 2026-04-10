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

    // Check for a pending invite by email (userId is empty = unclaimed)
    if (email) {
      const pendingInvites = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .take(10);

      const pending = pendingInvites.find((m) => m.userId === "");
      if (pending) {
        // Claim the invite
        await ctx.db.patch(pending._id, { userId });
        return pending.workspaceId;
      }
    }

    // No existing membership or invite — create a new workspace
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

export const listMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(20);
  },
});

export const inviteByEmail = mutation({
  args: { workspaceId: v.id("workspaces"), email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify caller is a member of this workspace
    const callerMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!callerMembership || callerMembership.workspaceId !== args.workspaceId) {
      throw new Error("Not a member of this workspace");
    }

    const email = args.email.toLowerCase().trim();

    // Check if this email is already a member
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .take(10);

    const alreadyInWorkspace = existing.find(
      (m) => m.workspaceId === args.workspaceId,
    );
    if (alreadyInWorkspace) {
      throw new Error("This person is already in your workspace");
    }

    // Create a pending member (empty userId = unclaimed)
    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: "",
      email,
      role: "member",
    });

    return { success: true };
  },
});

export const removeMember = mutation({
  args: { memberId: v.id("workspaceMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    // Can't remove yourself
    if (member.userId === identity.subject) {
      throw new Error("Cannot remove yourself");
    }

    // Verify caller is in the same workspace
    const callerMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!callerMembership || callerMembership.workspaceId !== member.workspaceId) {
      throw new Error("Not a member of this workspace");
    }

    await ctx.db.delete(args.memberId);
    return { success: true };
  },
});
