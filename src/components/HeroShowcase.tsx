"use client";
import { useEffect, useState } from "react";
import PreviewCanvas from "./PreviewCanvas";
import { TEMPLATES, defaultStyle } from "@/lib/templates";
import { sizeById } from "@/lib/sizes";
import { langByCode } from "@/lib/languages";
import type { Style } from "@/lib/types";
import { demoScreen } from "@/lib/demo";

function loadDemo(kind: "tasks" | "stats" | "focus", accent: string): HTMLImageElement {
  const img = new Image();
  img.src = demoScreen(kind, accent);
  return img;
}

const SAMPLES = [
  { template: "midnight", kind: "tasks" as const, accent: "#6d28d9", lang: "en", headline: "Plan your day in seconds", sub: "Smart lists that sort themselves" },
  { template: "sunrise", kind: "stats" as const, accent: "#ea580c", lang: "es", headline: "Mira tu progreso", sub: "Estadísticas semanales y rachas" },
  { template: "mint", kind: "focus" as const, accent: "#059669", lang: "ja", headline: "集中できる時間をつくる", sub: "ディープワークのためのタイマー" },
];

export default function HeroShowcase({ fontFamily }: { fontFamily: string }) {
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = SAMPLES.map((s) => loadDemo(s.kind, s.accent));
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
