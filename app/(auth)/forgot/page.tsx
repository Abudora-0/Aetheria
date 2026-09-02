import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
