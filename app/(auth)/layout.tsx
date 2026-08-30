import Link from "next/link";
import { AetheriaWordmark } from "@/components/brand/aetheria-mark";
import { AuroraBackdrop } from "@/components/visual/aurora-backdrop";
import { AetherField } from "@/components/visual/aether-field";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-4 py-16">
      <AuroraBackdrop subtle />
      <AetherField className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
      <Link href="/" className="absolute left-6 top-6 z-10">
        <AetheriaWordmark size={30} mode="static" />
      </Link>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
