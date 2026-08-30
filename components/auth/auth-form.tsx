"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DEMO_USER } from "@/lib/demo/generate";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (isSignUp) {
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not sign you in");
        return;
      }
      toast.success(isSignUp ? "Workspace created" : "Welcome back");
      router.push(params.get("next") ?? "/studio");
      router.refresh();
    } catch {
      toast.error("Network error, try again");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    (document.getElementById("email") as HTMLInputElement).value = DEMO_USER.email;
    (document.getElementById("password") as HTMLInputElement).value = DEMO_USER.password;
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="panel w-full max-w-sm space-y-4 p-7"
    >
      <span className="absolute inset-x-0 top-0 h-px [background:var(--aurora-gradient)]" />
      <div>
        <h1 className="text-2xl">{isSignUp ? "Create your workspace" : "Sign in to Aetheria"}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {isSignUp ? "Two channels free, forever." : "Pick up where the aether left off."}
        </p>
      </div>

      {isSignUp ? (
        <Field label="Name">
          <Input name="name" required autoComplete="name" placeholder="Nova Kessler" />
        </Field>
      ) : null}

      <Field label="Email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@studio.com" />
      </Field>

      <Field label="Password" hint={isSignUp ? "6 characters or more" : undefined}>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
          placeholder="........"
        />
      </Field>

      <Button type="submit" disabled={loading} className="w-full" magnetic={false}>
        {loading ? "One moment" : isSignUp ? "Create workspace" : "Sign in"}
      </Button>

      {!isSignUp ? (
        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          Use the demo account ({DEMO_USER.email} / {DEMO_USER.password})
        </button>
      ) : null}

      <p className="pt-1 text-center text-sm text-[var(--muted-foreground)]">
        {isSignUp ? "Already have an account? " : "New to Aetheria? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="text-[var(--foreground)] underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </motion.form>
  );
}
