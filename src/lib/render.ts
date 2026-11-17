import type { Caption, Style } from "./types";
import type { DeviceKind } from "./sizes";
import type { Language } from "./languages";

export interface RenderInput {
  width: number;
  height: number;
  image: CanvasImageSource | null;
  imageWidth: number;
  imageHeight: number;
  caption: Caption;
  style: Style;
  device: DeviceKind;
  lang: Language;
  fontFamily: string;
  watermark: string | null;
}

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrap(ctx: Ctx, text: string, maxWidth: number, noSpaces: boolean): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    const tokens = noSpaces ? Array.from(paragraph) : paragraph.split(/\s+/).filter(Boolean);
    const joiner = noSpaces ? "" : " ";
    let line = "";
    for (const token of tokens) {
      const candidate = line ? line + joiner + token : token;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) out.push(line);
      // A single token wider than the line: hard-break it by character.
      if (ctx.measureText(token).width > maxWidth) {
        let chunk = "";
        for (const ch of Array.from(token)) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            out.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      } else line = token;
    }
    if (line) out.push(line);
  }
  return out;
}

const DEFAULT_ASPECT: Record<DeviceKind, number> = {
  "ios-phone": 1290 / 2796,
  "ios-tablet": 2064 / 2752,
  "android-phone": 1080 / 2400,
  "android-tablet": 1600 / 2560,
};

export function renderScreenshot(ctx: Ctx, input: RenderInput) {
  const { width: W, height: H, style, device, lang, fontFamily } = input;
  const isTablet = device.endsWith("tablet");
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 1. Background gradient
  const a = (style.bgAngle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  const grad = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
  grad.addColorStop(0, style.bgFrom);
  grad.addColorStop(1, style.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Text measurement (auto-shrinks long translations to fit in 3 lines)
  const marginX = W * 0.07;
  const maxTextW = W - marginX * 2;
  const noSpaces = !!lang.noSpaces;
  let hSize = W * (isTablet ? 0.06 : 0.08) * style.textScale;
  let headLines: string[] = [];
  let subLines: string[] = [];
  let subSize = 0;
  for (let i = 0; i < 12; i++) {
    subSize = hSize * 0.5;
    ctx.font = `800 ${hSize}px ${fontFamily}`;
    headLines = input.caption.headline.trim() ? wrap(ctx, input.caption.headline.trim(), maxTextW, noSpaces) : [];
    ctx.font = `500 ${subSize}px ${fontFamily}`;
    subLines = input.caption.subheadline.trim() ? wrap(ctx, input.caption.subheadline.trim(), maxTextW, noSpaces) : [];
    if (headLines.length <= 3 && subLines.length <= 3) break;
    hSize *= 0.9;
  }
  const hLH = hSize * 1.12;
  const sLH = subSize * 1.35;
  const gap = headLines.length && subLines.length ? hSize * 0.35 : 0;
  const textH = headLines.length * hLH + gap + subLines.length * sLH;

  // 3. Layout regions
  const layout = style.layout;
  const textBottomLayout = layout === "text-bottom";
  const pad = H * 0.05;
  const textTop = textBottomLayout ? H - pad - textH : pad;
  let regionTop = textBottomLayout ? pad : textTop + textH + (textH ? H * 0.035 : 0);
  let regionBottom = textBottomLayout ? textTop - H * 0.035 : H - H * 0.04;
  if (!textH && !textBottomLayout) regionTop = pad;
  if (layout === "bleed") regionBottom = H + (H - regionTop) * 0.15;
  const regionH = Math.max(10, regionBottom - regionTop);

  // 4. Device geometry
  const screenAspect = input.image && input.imageWidth && input.imageHeight ? input.imageWidth / input.imageHeight : DEFAULT_ASPECT[device];
  // A phone-shaped screenshot on a tablet canvas gets a phone frame.
  const frameKind: DeviceKind =
    isTablet && screenAspect < 0.6 ? (device.startsWith("ios") ? "ios-phone" : "android-phone") : device;
  const tabletFrame = frameKind.endsWith("tablet");
  const k = style.frame === "device" ? (tabletFrame ? 0.03 : 0.04) : 0;
  const maxW = W * (tabletFrame ? 0.86 : layout === "bleed" ? 0.84 : 0.78) * (layout === "tilt" ? 0.9 : 1);
  let outerW = (regionH * (layout === "tilt" ? 0.9 : 1)) / ((1 - 2 * k) / screenAspect + 2 * k);
  if (outerW > maxW) outerW = maxW;
  const bezel = outerW * k;
  const screenW = outerW - bezel * 2;
  const screenH = screenW / screenAspect;
  const outerH = screenH + bezel * 2;
  const x = (W - outerW) / 2;
  const y = layout === "bleed" ? regionTop : regionTop + (regionH - outerH) / 2;

  const outerR =
    style.frame === "none" ? 0 :
    style.frame === "plain" ? outerW * (tabletFrame ? 0.03 : 0.07) :
    outerW * (frameKind === "ios-phone" ? 0.15 : frameKind === "android-phone" ? 0.11 : 0.05);
  const innerR = style.frame === "device" ? Math.max(outerR - bezel, outerW * 0.02) : outerR;

  ctx.save();
  if (layout === "tilt") {
    const cx = x + outerW / 2;
    const cy = y + outerH / 2;
    ctx.translate(cx, cy);
    ctx.rotate((-7 * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  // Shadow + body
  if (style.frame !== "none") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = W * 0.05;
    ctx.shadowOffsetY = W * 0.02;
    roundRect(ctx, x, y, outerW, outerH, outerR);
    ctx.fillStyle = style.frame === "device" ? style.frameColor : "#ffffff";
    ctx.fill();
    ctx.restore();
  }
  if (style.frame === "device") {
    // Subtle edge highlight
    roundRect(ctx, x + bezel * 0.08, y + bezel * 0.08, outerW - bezel * 0.16, outerH - bezel * 0.16, outerR - bezel * 0.08);
    ctx.lineWidth = Math.max(1, bezel * 0.12);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.stroke();
  }

  // Screen content
  const sx = x + bezel;
  const sy = y + bezel;
  ctx.save();
  roundRect(ctx, sx, sy, screenW, screenH, innerR);
  ctx.clip();
  if (input.image) {
    const iw = input.imageWidth;
    const ih = input.imageHeight;
    const scale = Math.max(screenW / iw, screenH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(input.image, sx + (screenW - dw) / 2, sy + (screenH - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + screenH);
    g.addColorStop(0, "#e5e7eb");
    g.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, screenW, screenH);
    ctx.fillStyle = "#64748b";
    ctx.font = `600 ${screenW * 0.07}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Your screenshot", sx + screenW / 2, sy + screenH / 2);
  }
  ctx.restore();

  // Hardware details
  if (style.frame === "device") {
    ctx.fillStyle = "#000000";
    if (frameKind === "ios-phone") {
      const pw = screenW * 0.3;
      const ph = screenW * 0.085;
      roundRect(ctx, sx + (screenW - pw) / 2, sy + screenW * 0.03, pw, ph, ph / 2);
      ctx.fill();
    } else if (frameKind === "android-phone") {
      ctx.beginPath();
      ctx.arc(sx + screenW / 2, sy + screenW * 0.045, screenW * 0.025, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(x + outerW / 2, y + bezel / 2, Math.max(1, bezel * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 5. Text
  ctx.textBaseline = "top";
  ctx.direction = lang.rtl ? "rtl" : "ltr";
  let tx: number;
  if (style.align === "center") {
    ctx.textAlign = "center";
    tx = W / 2;
  } else if (lang.rtl) {
    ctx.textAlign = "right";
    tx = W - marginX;
  } else {
    ctx.textAlign = "left";
    tx = marginX;
  }
  let ty = textTop;
  ctx.fillStyle = style.textColor;
  ctx.font = `800 ${hSize}px ${fontFamily}`;
  for (const line of headLines) {
    ctx.fillText(line, tx, ty);
    ty += hLH;
  }
  ty += gap;
  ctx.fillStyle = style.subColor;
  ctx.font = `500 ${subSize}px ${fontFamily}`;
  for (const line of subLines) {
    ctx.fillText(line, tx, ty);
    ty += sLH;
  }

  // 6. Watermark (free plan)
  if (input.watermark) {
    ctx.direction = "ltr";
    const fs = W * 0.026;
    ctx.font = `600 ${fs}px ${fontFamily}`;
    const tw = ctx.measureText(input.watermark).width;
    const pw = tw + fs * 1.6;
    const ph = fs * 2;
    const px = (W - pw) / 2;
    const py = H - ph - H * 0.015;
    roundRect(ctx, px, py, pw, ph, ph / 2);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(input.watermark, W / 2, py + ph / 2);
  }

  ctx.restore();
}
