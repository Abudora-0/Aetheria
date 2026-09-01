"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[aetheria] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07080d",
          color: "#eef0fb",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 1.25rem",
              borderRadius: "50%",
              border: "3px solid #8b5cf6",
              boxShadow: "0 0 0 6px rgba(139,92,246,0.14)",
            }}
          />
          <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.5rem" }}>The aether went dark</h1>
          <p style={{ color: "#9aa0be", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            Something failed at the root of the app. Reloading usually clears it.
          </p>
          <button
            onClick={reset}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "0.7rem 1.4rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#07080d",
              cursor: "pointer",
              background: "linear-gradient(110deg, #4fd1c5, #8b5cf6 50%, #f472b6)",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
