    import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Save a request to history
export const saveRequest = mutation({
  args: {
    userId: v.string(),
    url: v.string(),
    method: v.string(),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    responseStatus: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const historyId = await ctx.db.insert("history", {
      userId: args.userId,
      url: args.url,
      method: args.method,
      headers: args.headers,
      params: args.params,
      body: args.body,
      responseStatus: args.responseStatus,
      duration: args.duration,
      createdAt: Date.now(),
    });

    return historyId;
  },
});

// Get user's request history
export const getHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("history")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return history.map(item => ({
      id: item._id,
      userId: item.userId,
      url: item.url,
      method: item.method,
      headers: item.headers,
      params: item.params,
      body: item.body,
      responseStatus: item.responseStatus,
      duration: item.duration,
      createdAt: item.createdAt,
    }));
  },
});

// Delete a history item
export const deleteHistoryItem = mutation({
  args: {
    historyId: v.id("history"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the history item belongs to the user
    const historyItem = await ctx.db.get(args.historyId);
    if (!historyItem || historyItem.userId !== args.userId) {
      throw new Error("History item not found or access denied");
    }
    
    await ctx.db.delete(args.historyId);
    return true;
  },
});

// Clear all user history
export const clearUserHistory = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const historyItems = await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all items
    await Promise.all(historyItems.map(item => ctx.db.delete(item._id)));
    
    return { deletedCount: historyItems.length };
  },
});

// Get a specific history item
export const getHistoryItem = query({
  args: {
    historyId: v.id("history"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const historyItem = await ctx.db.get(args.historyId);
    
    // Verify the history item belongs to the user
    if (!historyItem || historyItem.userId !== args.userId) {
      return null;
    }

    return {
      id: historyItem._id,
      userId: historyItem.userId,
      url: historyItem.url,
      method: historyItem.method,
      headers: historyItem.headers,
      params: historyItem.params,
      body: historyItem.body,
      responseStatus: historyItem.responseStatus,
      duration: historyItem.duration,
      createdAt: historyItem.createdAt,
    };
  },
});