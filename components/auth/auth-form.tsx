"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { AuthAsideMobile } from "@/components/auth/auth-aside";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DEMO_USER } from "@/lib/demo/generate";

type Mode = "sign-in" | "sign-up";
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

function Row({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <div className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
      {children}
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    if (isSignUp) payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const fieldErrors = json.issues?.fieldErrors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([k, v]) => [k, v[0]]),
            ) as FieldErrors,
          );
        }
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
    <div>
      <AuthAsideMobile />
      <form onSubmit={onSubmit} className="panel relative overflow-hidden p-6 sm:p-8">
        <span className="absolute inset-x-0 top-0 h-px [background:var(--aurora-gradient)]" />

        <Row i={0}>
          <div className="mb-5 flex items-center gap-3">
            <AetheriaMark size={40} mode="idle" />
            <div>
              <h1 className="text-2xl">
                {isSignUp ? "Create your workspace" : "Sign in to Aetheria"}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {isSignUp ? "Two channels free, forever." : "Pick up where the aether left off."}
              </p>
            </div>
          </div>
        </Row>

        <div className="space-y-4">
          {isSignUp ? (
            <Row i={1}>
              <Field label="Name" error={errors.name}>
                <Input name="name" required autoComplete="name" placeholder="Nova Kessler" />
              </Field>
            </Row>
          ) : null}

          <Row i={isSignUp ? 2 : 1}>
            <Field label="Email" error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@studio.com"
              />
            </Field>
          </Row>

          <Row i={isSignUp ? 3 : 2}>
            <Field
              label="Password"
              hint={isSignUp ? "6 characters or more" : undefined}
              error={errors.password}
            >
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="Your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--faint-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            {!isSignUp ? (
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot"
                  className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}
          </Row>
        </div>

        <Row i={isSignUp ? 4 : 3}>
          <div className="mt-5 space-y-3">
            <Button type="submit" disabled={loading} className="w-full" magnetic={false}>
              {loading ? "One moment" : isSignUp ? "Create workspace" : "Sign in"}
            </Button>

            {!isSignUp ? (
              <button
                type="button"
                onClick={fillDemo}
                className="w-full rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--aurora-violet)] hover:text-[var(--foreground)]"
              >
                Use the demo account ({DEMO_USER.email} / {DEMO_USER.password})
              </button>
            ) : null}
          </div>
        </Row>

        <Row i={isSignUp ? 5 : 4}>
          <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
            {isSignUp ? "Already have an account? " : "New to Aetheria? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="link-sweep font-medium text-[var(--foreground)]"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </Row>
      </form>
    </div>
  );
}
