"use client";
import { useEffect, useState } from "react";
import PreviewCanvas from "./PreviewCanvas";
import { TEMPLATES, defaultStyle } from "@/lib/templates";
import { sizeById } from "@/lib/sizes";
import { langByCode } from "@/lib/languages";
import type { Style } from "@/lib/types";

// Draws a fake app screen so the landing page shows real renderer output.
function fakeScreen(accent: string): HTMLImageElement {
  const w = 645;
  const h = 1398;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = "#f8fafc";
  x.fillRect(0, 0, w, h);
  x.fillStyle = accent;
  x.fillRect(0, 0, w, 360);
  x.fillStyle = "rgba(255,255,255,0.9)";
  x.font = "800 52px system-ui, sans-serif";
  x.fillText("Good morning", 48, 220);
  x.font = "500 30px system-ui, sans-serif";
  x.fillText("3 tasks left today", 48, 275);
  const rows = ["Design review", "Ship v2.1", "Reply to Maya", "Gym · 6pm", "Plan Q3"];
  rows.forEach((r, i) => {
    const y = 410 + i * 170;
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.roundRect(36, y, w - 72, 140, 28);
    x.fill();
    x.fillStyle = i % 2 ? "#e2e8f0" : accent;
    x.beginPath();
    x.arc(100, y + 70, 26, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#0f172a";
    x.font = "700 34px system-ui, sans-serif";
    x.fillText(r, 150, y + 62);
    x.fillStyle = "#94a3b8";
    x.font = "500 24px system-ui, sans-serif";
    x.fillText("Today", 150, y + 100);
  });
  const img = new Image();
  img.src = c.toDataURL("image/png");
  return img;
}

const SAMPLES = [
  { template: "midnight", accent: "#6d28d9", lang: "en", headline: "Plan your day in seconds", sub: "Smart lists that sort themselves" },
  { template: "sunrise", accent: "#ea580c", lang: "es", headline: "Organiza tu día en segundos", sub: "Listas inteligentes que se ordenan solas" },
  { template: "mint", accent: "#059669", lang: "ja", headline: "数秒で一日を計画", sub: "自動で整理されるスマートリスト" },
];

export default function HeroShowcase({ fontFamily }: { fontFamily: string }) {
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = SAMPLES.map((s) => fakeScreen(s.accent));
    Promise.all(list.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => (i.onload = r)))))
      .then(() => document.fonts.load(`800 40px ${fontFamily}`))
      .catch(() => {})
      .finally(() => {
        setImgs(list);
        setReady(true);
      });
  }, [fontFamily]);

  const size = sizeById("iphone-6.9");
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6" aria-label="Example screenshots in English, Spanish and Japanese">
      {SAMPLES.map((s, i) => {
        const t = TEMPLATES.find((x) => x.id === s.template)!;
        const style: Style = { ...defaultStyle(), templateId: t.id, ...t.style };
        return (
          <div key={s.template} className={i === 1 ? "sm:-translate-y-6" : "hidden sm:block"}>
            <PreviewCanvas
              size={size}
              image={imgs?.[i] ?? null}
              imageWidth={645}
              imageHeight={1398}
              caption={{ headline: s.headline, subheadline: s.sub }}
              style={style}
              lang={langByCode(s.lang)}
              fontFamily={fontFamily}
              watermark={null}
              displayWidth={200}
              fontsReady={ready}
            />
            <p className="mt-2 text-center text-xs text-neutral-500">{langByCode(s.lang).name}</p>
          </div>
        );
      })}
    </div>
  );
}
