import Link from "next/link";
import { AetheriaMark } from "@/components/brand/aetheria-mark";

export default function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-5">
        <AetheriaMark size={72} />
        <h1 className="text-4xl">Lost in the aether</h1>
        <p className="max-w-sm text-[var(--muted-foreground)]">
          That page drifted out of range. Let us guide you back.
        </p>
        <Link
          href="/"
          className="rounded-[var(--radius-md)] [background:var(--aurora-gradient)] px-5 py-2.5 text-sm font-semibold text-[#07080d]"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
