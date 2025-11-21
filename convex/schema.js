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
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  collections: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  collectionItems: defineTable({
    collectionId: v.id("collections"),
    name: v.string(),
    url: v.string(),
    method: v.string(),
    headers: v.optional(v.string()),
    params: v.optional(v.string()),
    body: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_collection", ["collectionId"]),
});