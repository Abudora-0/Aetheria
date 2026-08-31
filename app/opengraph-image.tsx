import { ImageResponse } from "next/og";
import { APP_TAGLINE } from "@/lib/constants";

export const runtime = "nodejs";
export const alt = "Aetheria - automated social scheduling and analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RINGS = [
  { d: 150, color: "#4FD1C5", w: 10, o: 0.95 },
  { d: 260, color: "#8B5CF6", w: 8, o: 0.55 },
  { d: 370, color: "#F472B6", w: 6, o: 0.3 },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#07080D",
          backgroundImage:
            "radial-gradient(600px 400px at 8% 0%, rgba(79,209,197,0.16), transparent 60%), radial-gradient(700px 500px at 100% 20%, rgba(139,92,246,0.20), transparent 60%), radial-gradient(500px 400px at 60% 120%, rgba(244,114,182,0.14), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", right: 60, top: 90, display: "flex" }}>
          <div
            style={{
              width: 420,
              height: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {RINGS.map((r) => (
              <div
                key={r.d}
                style={{
                  position: "absolute",
                  width: r.d,
                  height: r.d,
                  borderRadius: r.d,
                  border: `${r.w}px solid ${r.color}`,
                  opacity: r.o,
                }}
              />
            ))}
            <div
              style={{ position: "absolute", width: 34, height: 34, borderRadius: 34, background: "#F5C451" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 26, letterSpacing: 6, color: "#9AA0BE", textTransform: "uppercase" }}>
            Aetheria
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 700,
            color: "#EEF0FB",
            lineHeight: 1.05,
            marginTop: 18,
            maxWidth: 760,
          }}
        >
          Send your words into the aether, on schedule.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#9AA0BE", marginTop: 28, maxWidth: 720 }}>
          {APP_TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
