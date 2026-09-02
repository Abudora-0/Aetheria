"use client";

import { usePathname } from "next/navigation";

/**
 * Replays a short CSS entrance when the studio route changes. Keyed on the
 * pathname so React remounts the subtree; uses CSS (not JS) so the content is
 * always painted even if animations are throttled.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-rise">
      {children}
    </div>
  );
}
