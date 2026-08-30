import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, { issues: err.flatten() });
  }
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return fail("You need to sign in", 401);
  }
  console.error("[aetheria] route error", err);
  return fail("Something went wrong on our side", 500);
}
