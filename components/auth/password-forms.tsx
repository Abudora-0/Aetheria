"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";
import { AetheriaMark } from "@/components/brand/aetheria-mark";
import { AuthAsideMobile } from "@/components/auth/auth-aside";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AuthAsideMobile />
      <div className="panel animate-rise relative overflow-hidden p-6 sm:p-8">
        <span className="absolute inset-x-0 top-0 h-px [background:var(--aurora-gradient)]" />
        {children}
      </div>
    </div>
  );
}

export function ForgotForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = new FormData(e.currentTarget).get("email");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else toast.error("Something went wrong, try again");
    } catch {
      toast.error("Network error, try again");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Shell>
        <MailCheck size={28} className="text-[var(--aurora-teal)]" />
        <h1 className="mt-4 text-2xl">Check your inbox</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          If an account exists for that address, a reset link is on its way. It expires in one
          hour.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--foreground)] link-sweep"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center gap-3">
        <AetheriaMark size={38} mode="idle" />
        <div>
          <h1 className="text-2xl">Reset your password</h1>
          <p className="text-sm text-[var(--muted-foreground)]">We will email you a link.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@studio.com" />
        </Field>
        <Button type="submit" disabled={loading} className="w-full" magnetic={false}>
          {loading ? "Sending" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        Remembered it?{" "}
        <Link href="/sign-in" className="link-sweep font-medium text-[var(--foreground)]">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

export function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const token = params.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setError("The two passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not reset your password");
        return;
      }
      toast.success("Password updated");
      router.push("/studio");
      router.refresh();
    } catch {
      toast.error("Network error, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center gap-3">
        <AetheriaMark size={38} mode="idle" />
        <div>
          <h1 className="text-2xl">Choose a new password</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {token ? "Almost there." : "This link is missing its token."}
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" hint="6 characters or more">
          <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={error ?? undefined}>
          <Input name="confirm" type="password" required minLength={6} autoComplete="new-password" />
        </Field>
        <Button type="submit" disabled={loading || !token} className="w-full" magnetic={false}>
          {loading ? "Saving" : "Update password"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/sign-in" className="link-sweep font-medium text-[var(--foreground)]">
          Back to sign in
        </Link>
      </p>
    </Shell>
  );
}
