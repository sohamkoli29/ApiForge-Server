/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { any } from "convex/values";

/**
 * No `schema.ts` file found!
 *
 * This generated code has permissive types like `Doc = any` because
 * Convex doesn't know your schema. If you'd like more type safety, see
 * https://docs.convex.dev/using/schemas for instructions on how to add a
 * schema file.
 *
 * After you change a schema, rerun code generation with `npx convex dev`.
 */

/**
 * The names of all of your Convex tables.
 */
export type TableNames = string;

/**
 * The type of a document stored in Convex.
 */
export type Doc = any;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is a
 * string that encodes a table name and a unique identifier.
 *
 * You can read the name of the table for a `Id` with `Id.tableName`.
 */
export type Id = string;

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */
export type DataModel = any;