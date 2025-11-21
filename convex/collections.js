import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new collection
export const createCollection = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const collectionId = await ctx.db.insert("collections", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });

    return collectionId;
  },
});

// Get user's collections
export const getCollections = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get item counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const items = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
          .collect();

        return {
          id: collection._id,
          userId: collection.userId,
          name: collection.name,
          description: collection.description,
          color: collection.color,
          itemCount: items.length,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        };
      })
    );

    return collectionsWithCounts;
  },
});

// Update a collection
export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    userId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify the collection belongs to the user
    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== args.userId) {
      throw new Error("Collection not found or access denied");
    }

    const updates = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.collectionId, updates);
    return true;
  },
});

// Delete a collection and its items
export const deleteCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the collection belongs to the user
    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== args.userId) {
      throw new Error("Collection not found or access denied");
    }

    // Delete all items in the collection
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    await Promise.all(items.map(item => ctx.db.delete(item._id)));

    // Delete the collection
    await ctx.db.delete(args.collectionId);
    return { deletedCollection: true, deletedItems: items.length };
  },
});

// Add request to collection
export const addToCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    userId: v.string(),
    name: v.string(),
    url: v.string(),
    method: v.string(),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify the collection belongs to the user
    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== args.userId) {
      throw new Error("Collection not found or access denied");
    }

    const now = Date.now();
    const itemId = await ctx.db.insert("collectionItems", {
      collectionId: args.collectionId,
      userId: args.userId,
      name: args.name,
      url: args.url,
      method: args.method,
      headers: args.headers,
      params: args.params,
      body: args.body,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    // Update collection's updatedAt
    await ctx.db.patch(args.collectionId, { updatedAt: now });

    return itemId;
  },
});

// Get items in a collection
export const getCollectionItems = query({
  args: {
    collectionId: v.id("collections"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the collection belongs to the user
    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== args.userId) {
      throw new Error("Collection not found or access denied");
    }

    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_updated", (q) => q.eq("collectionId", args.collectionId))
      .order("desc")
      .collect();

    return items.map(item => ({
      id: item._id,
      collectionId: item.collectionId,
      userId: item.userId,
      name: item.name,
      url: item.url,
      method: item.method,
      headers: item.headers,
      params: item.params,
      body: item.body,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  },
});

// Update collection item
export const updateCollectionItem = mutation({
  args: {
    itemId: v.id("collectionItems"),
    userId: v.string(),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    method: v.optional(v.string()),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify the item belongs to the user
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== args.userId) {
      throw new Error("Collection item not found or access denied");
    }

    const updates = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.url !== undefined) updates.url = args.url;
    if (args.method !== undefined) updates.method = args.method;
    if (args.headers !== undefined) updates.headers = args.headers;
    if (args.params !== undefined) updates.params = args.params;
    if (args.body !== undefined) updates.body = args.body;
    if (args.description !== undefined) updates.description = args.description;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.itemId, updates);

    // Update collection's updatedAt
    if (item.collectionId) {
      await ctx.db.patch(item.collectionId, { updatedAt: updates.updatedAt });
    }

    return true;
  },
});

// Remove item from collection
export const removeFromCollection = mutation({
  args: {
    itemId: v.id("collectionItems"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the item belongs to the user
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== args.userId) {
      throw new Error("Collection item not found or access denied");
    }

    await ctx.db.delete(args.itemId);
    return true;
  },
});

// Move item to different collection
export const moveCollectionItem = mutation({
  args: {
    itemId: v.id("collectionItems"),
    newCollectionId: v.id("collections"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the item belongs to the user
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== args.userId) {
      throw new Error("Collection item not found or access denied");
    }

    // Verify the new collection belongs to the user
    const newCollection = await ctx.db.get(args.newCollectionId);
    if (!newCollection || newCollection.userId !== args.userId) {
      throw new Error("New collection not found or access denied");
    }

    const now = Date.now();
    
    // Update the item
    await ctx.db.patch(args.itemId, {
      collectionId: args.newCollectionId,
      updatedAt: now,
    });

    // Update both collections' updatedAt
    await ctx.db.patch(args.newCollectionId, { updatedAt: now });
    if (item.collectionId) {
      await ctx.db.patch(item.collectionId, { updatedAt: now });
    }

    return true;
  },
});