import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  history: defineTable({
    userId: v.string(),
    url: v.string(),
    method: v.string(),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    responseStatus: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"]),
  
  collections: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_updated", ["userId", "updatedAt"]),
  
  collectionItems: defineTable({
    collectionId: v.id("collections"),
    userId: v.string(),
    name: v.string(),
    url: v.string(),
    method: v.string(),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_collection", ["collectionId"])
  .index("by_user", ["userId"])
  .index("by_collection_updated", ["collectionId", "updatedAt"]),
});