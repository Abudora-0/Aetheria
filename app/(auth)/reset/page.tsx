import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
