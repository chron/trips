/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiChat from "../aiChat.js";
import type * as chat from "../chat.js";
import type * as chatTools from "../chatTools.js";
import type * as http from "../http.js";
import type * as ingestion from "../ingestion.js";
import type * as moodboardAssets from "../moodboardAssets.js";
import type * as moodboards from "../moodboards.js";
import type * as pins from "../pins.js";
import type * as scratchpads from "../scratchpads.js";
import type * as trips from "../trips.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiChat: typeof aiChat;
  chat: typeof chat;
  chatTools: typeof chatTools;
  http: typeof http;
  ingestion: typeof ingestion;
  moodboardAssets: typeof moodboardAssets;
  moodboards: typeof moodboards;
  pins: typeof pins;
  scratchpads: typeof scratchpads;
  trips: typeof trips;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
