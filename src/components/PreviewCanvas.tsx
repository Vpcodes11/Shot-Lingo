"use client";
import { useEffect, useRef } from "react";
import { renderScreenshot } from "@/lib/render";
import type { Caption, Style } from "@/lib/types";
import type { ExportSize } from "@/lib/sizes";
import type { Language } from "@/lib/languages";

interface Props {
  size: ExportSize;
  image: HTMLImageElement | null;
  imageWidth: number;
  imageHeight: number;
  caption: Caption;
  style: Style;
  lang: Language;
  fontFamily: string;
  watermark: string | null;
  displayWidth: number;
  fontsReady: boolean;
}

export default function PreviewCanvas(p: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const displayHeight = Math.round((p.displayWidth * p.size.height) / p.size.width);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = Math.round(p.displayWidth * dpr);
    const h = Math.round(displayHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderScreenshot(ctx, {
      width: w,
      height: h,
      image: p.image,
      imageWidth: p.imageWidth,
      imageHeight: p.imageHeight,
      caption: p.caption,
      style: p.style,
      device: p.size.device,
      lang: p.lang,
      fontFamily: p.fontFamily,
      watermark: p.watermark,
    });
  }, [p.image, p.imageWidth, p.imageHeight, p.caption, p.style, p.size, p.lang, p.fontFamily, p.watermark, p.displayWidth, displayHeight, p.fontsReady]);

  return (
    <canvas
      ref={ref}
      style={{ width: p.displayWidth, height: displayHeight }}
      className="rounded-xl shadow-sm ring-1 ring-black/5"
    />
  );
}
