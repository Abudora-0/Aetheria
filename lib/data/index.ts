import { resolveDataMode } from "@/lib/env";
import type { DataPort } from "@/lib/data/ports";
import { demoPort } from "@/lib/data/demo-port";

/**
 * Single entry point for all persistence. The live Mongoose port is imported
 * lazily so demo deployments never load the driver.
 */
let livePortPromise: Promise<DataPort> | null = null;

export async function getData(): Promise<DataPort> {
  if (resolveDataMode() === "demo") return demoPort;
  if (!livePortPromise) {
    livePortPromise = import("@/lib/data/live-port").then((m) => m.livePort);
  }
  return livePortPromise;
}

export type { DataPort } from "@/lib/data/ports";
