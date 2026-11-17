import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: App Store screenshots in every size and 40 languages`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Phone({ from, to, title, rotate }: { from: string; to: string; title: string; rotate: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 210,
        height: 400,
        borderRadius: 28,
        padding: 18,
        background: `linear-gradient(160deg, ${from}, ${to})`,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ color: "white", fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flex: 1, width: 140, borderRadius: 22, background: "#0b0b10", padding: 6 }}>
        <div style={{ display: "flex", flex: 1, borderRadius: 17, background: "#f8fafc" }} />
      </div>
    </div>
  );
}

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0f", padding: 70, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
          <div style={{ color: "#a5b4fc", fontSize: 30, fontWeight: 700 }}>{SITE.name}</div>
          <div style={{ color: "white", fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>
            App Store screenshots in every size and 40 languages
          </div>
          <div style={{ color: "#a3a3a3", fontSize: 28, marginTop: 24 }}>AI captions · device frames · one ZIP</div>
        </div>
        <div style={{ display: "flex", gap: 24, marginLeft: 40 }}>
          <Phone from="#1e1b4b" to="#4c1d95" title="Plan your day" rotate={-6} />
          <Phone from="#f97316" to="#db2777" title="Planifica tu día" rotate={4} />
        </div>
      </div>
    ),
    size,
  );
}
