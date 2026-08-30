import mongoose from "mongoose";
import { env } from "@/lib/env";

/**
 * Cached Mongoose connection. Serverless functions reuse the same module scope
 * across warm invocations, so we memoize the connection promise on globalThis.
 */

interface Cache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { _aetheriaMongoose?: Cache };

const cache: Cache = globalForMongoose._aetheriaMongoose ?? { conn: null, promise: null };
globalForMongoose._aetheriaMongoose = cache;

export async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not set. The app runs in demo mode without it.");
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUri, {
      bufferCommands: false,
      dbName: "aetheria",
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
