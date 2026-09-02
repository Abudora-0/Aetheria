import { AuthAside } from "@/components/auth/auth-aside";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <AuthAside />
      <div className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-20 blur-[110px] lg:hidden"
          style={{ background: "var(--aurora-magenta)" }}
        />
        <div className="relative z-10 w-full max-w-[26rem]">{children}</div>
      </div>
    </div>
  );
}
