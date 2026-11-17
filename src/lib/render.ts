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
  appName?: string;
}

type Ctx = CanvasRenderingContext2D;
type FrameKind = Exclude<DeviceKind, "feature-graphic">;

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

const DEFAULT_ASPECT: Record<FrameKind, number> = {
  "ios-phone": 1290 / 2796,
  "ios-tablet": 2064 / 2752,
  "android-phone": 1080 / 2400,
  "android-tablet": 1600 / 2560,
};

function drawBackground(ctx: Ctx, W: number, H: number, style: Style) {
  const a = (style.bgAngle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  const grad = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
  grad.addColorStop(0, style.bgFrom);
  grad.addColorStop(1, style.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

/** Fits headline + subheadline into maxW, shrinking until each fits in maxLines. */
function fitText(
  ctx: Ctx,
  caption: Caption,
  startSize: number,
  maxW: number,
  maxLines: number,
  fontFamily: string,
  noSpaces: boolean,
) {
  let hSize = startSize;
  let headLines: string[] = [];
  let subLines: string[] = [];
  let subSize = 0;
  for (let i = 0; i < 14; i++) {
    subSize = hSize * 0.5;
    ctx.font = `800 ${hSize}px ${fontFamily}`;
    headLines = caption.headline.trim() ? wrap(ctx, caption.headline.trim(), maxW, noSpaces) : [];
    ctx.font = `500 ${subSize}px ${fontFamily}`;
    subLines = caption.subheadline.trim() ? wrap(ctx, caption.subheadline.trim(), maxW, noSpaces) : [];
    if (headLines.length <= maxLines && subLines.length <= maxLines) break;
    hSize *= 0.9;
  }
  const hLH = hSize * 1.12;
  const sLH = subSize * 1.35;
  const gap = headLines.length && subLines.length ? hSize * 0.35 : 0;
  return { hSize, subSize, headLines, subLines, hLH, sLH, gap, height: headLines.length * hLH + gap + subLines.length * sLH };
}

function drawText(
  ctx: Ctx,
  t: ReturnType<typeof fitText>,
  x: number,
  y: number,
  align: CanvasTextAlign,
  style: Style,
  lang: Language,
  fontFamily: string,
) {
  ctx.textBaseline = "top";
  ctx.direction = lang.rtl ? "rtl" : "ltr";
  ctx.textAlign = align;
  let ty = y;
  ctx.fillStyle = style.textColor;
  ctx.font = `800 ${t.hSize}px ${fontFamily}`;
  for (const line of t.headLines) {
    ctx.fillText(line, x, ty);
    ty += t.hLH;
  }
  ty += t.gap;
  ctx.fillStyle = style.subColor;
  ctx.font = `500 ${t.subSize}px ${fontFamily}`;
  for (const line of t.subLines) {
    ctx.fillText(line, x, ty);
    ty += t.sLH;
  }
}

interface DeviceDraw {
  x: number;
  y: number;
  outerW: number;
  screenAspect: number;
  frameKind: FrameKind;
  rotateDeg: number;
  shadowScale: number;
}

/** Computes the outer height of a device for a given width (used for layout). */
function deviceOuterH(outerW: number, screenAspect: number, frameKind: FrameKind, style: Style) {
  const k = style.frame === "device" ? (frameKind.endsWith("tablet") ? 0.03 : 0.04) : 0;
  const bezel = outerW * k;
  return (outerW - bezel * 2) / screenAspect + bezel * 2;
}

function deviceK(frameKind: FrameKind, style: Style) {
  return style.frame === "device" ? (frameKind.endsWith("tablet") ? 0.03 : 0.04) : 0;
}

function drawDevice(ctx: Ctx, d: DeviceDraw, input: RenderInput) {
  const { style, fontFamily } = input;
  const { x, y, outerW, screenAspect, frameKind } = d;
  const tabletFrame = frameKind.endsWith("tablet");
  const bezel = outerW * deviceK(frameKind, style);
  const screenW = outerW - bezel * 2;
  const screenH = screenW / screenAspect;
  const outerH = screenH + bezel * 2;
  const outerR =
    style.frame === "none" ? 0 :
    style.frame === "plain" ? outerW * (tabletFrame ? 0.03 : 0.07) :
    outerW * (frameKind === "ios-phone" ? 0.15 : frameKind === "android-phone" ? 0.11 : 0.05);
  const innerR = style.frame === "device" ? Math.max(outerR - bezel, outerW * 0.02) : outerR;

  ctx.save();
  if (d.rotateDeg) {
    const cx = x + outerW / 2;
    const cy = y + outerH / 2;
    ctx.translate(cx, cy);
    ctx.rotate((d.rotateDeg * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (style.frame !== "none") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = d.shadowScale * 0.05;
    ctx.shadowOffsetY = d.shadowScale * 0.02;
    roundRect(ctx, x, y, outerW, outerH, outerR);
    ctx.fillStyle = style.frame === "device" ? style.frameColor : "#ffffff";
    ctx.fill();
    ctx.restore();
  }
  if (style.frame === "device") {
    roundRect(ctx, x + bezel * 0.08, y + bezel * 0.08, outerW - bezel * 0.16, outerH - bezel * 0.16, outerR - bezel * 0.08);
    ctx.lineWidth = Math.max(1, bezel * 0.12);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.stroke();
  }

  const sx = x + bezel;
  const sy = y + bezel;
  ctx.save();
  roundRect(ctx, sx, sy, screenW, screenH, innerR);
  ctx.clip();
  if (input.image) {
    const scale = Math.max(screenW / input.imageWidth, screenH / input.imageHeight);
    const dw = input.imageWidth * scale;
    const dh = input.imageHeight * scale;
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
    ctx.direction = "ltr";
    ctx.fillText("Your screenshot", sx + screenW / 2, sy + screenH / 2);
  }
  ctx.restore();

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
}

function drawWatermark(ctx: Ctx, W: number, H: number, text: string, fontFamily: string, scaleBase: number) {
  ctx.save();
  ctx.direction = "ltr";
  const fs = scaleBase * 0.026;
  ctx.font = `600 ${fs}px ${fontFamily}`;
  const tw = ctx.measureText(text).width;
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
  ctx.fillText(text, W / 2, py + ph / 2);
  ctx.restore();
}

function screenAspectOf(input: RenderInput, fallback: FrameKind) {
  return input.image && input.imageWidth && input.imageHeight ? input.imageWidth / input.imageHeight : DEFAULT_ASPECT[fallback];
}

export function renderScreenshot(ctx: Ctx, input: RenderInput) {
  if (input.device === "feature-graphic") return renderFeatureGraphic(ctx, input);
  const { width: W, height: H, style, lang, fontFamily } = input;
  const device = input.device as FrameKind;
  const isTablet = device.endsWith("tablet");
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H, style);

  // Text (auto-shrinks long translations to fit in 3 lines)
  const marginX = W * 0.07;
  const t = fitText(ctx, input.caption, W * (isTablet ? 0.06 : 0.08) * style.textScale, W - marginX * 2, 3, fontFamily, !!lang.noSpaces);

  // Layout regions
  const layout = style.layout;
  const textBottomLayout = layout === "text-bottom";
  const pad = H * 0.05;
  const textTop = textBottomLayout ? H - pad - t.height : pad;
  let regionTop = textBottomLayout ? pad : textTop + t.height + (t.height ? H * 0.035 : 0);
  let regionBottom = textBottomLayout ? textTop - H * 0.035 : H - H * 0.04;
  if (!t.height && !textBottomLayout) regionTop = pad;
  if (layout === "bleed") regionBottom = H + (H - regionTop) * 0.15;
  const regionH = Math.max(10, regionBottom - regionTop);

  // Device geometry. A phone-shaped screenshot on a tablet canvas gets a phone frame.
  const screenAspect = screenAspectOf(input, device);
  const frameKind: FrameKind = isTablet && screenAspect < 0.6 ? (device.startsWith("ios") ? "ios-phone" : "android-phone") : device;
  const tabletFrame = frameKind.endsWith("tablet");
  const k = deviceK(frameKind, style);
  const maxW = W * (tabletFrame ? 0.86 : layout === "bleed" ? 0.84 : 0.78) * (layout === "tilt" ? 0.9 : 1);
  let outerW = (regionH * (layout === "tilt" ? 0.9 : 1)) / ((1 - 2 * k) / screenAspect + 2 * k);
  if (outerW > maxW) outerW = maxW;
  const outerH = deviceOuterH(outerW, screenAspect, frameKind, style);
  const x = (W - outerW) / 2;
  const y = layout === "bleed" ? regionTop : regionTop + (regionH - outerH) / 2;
  drawDevice(ctx, { x, y, outerW, screenAspect, frameKind, rotateDeg: layout === "tilt" ? -7 : 0, shadowScale: W }, input);

  // Caption
  let tx = W / 2;
  let align: CanvasTextAlign = "center";
  if (style.align === "left") {
    align = lang.rtl ? "right" : "left";
    tx = lang.rtl ? W - marginX : marginX;
  }
  drawText(ctx, t, tx, textTop, align, style, lang, fontFamily);

  if (input.watermark) drawWatermark(ctx, W, H, input.watermark, fontFamily, W);
  ctx.restore();
}

/** Google Play feature graphic (1024×500): text on one side, tilted phone on the other. */
function renderFeatureGraphic(ctx: Ctx, input: RenderInput) {
  const { width: W, height: H, style, lang, fontFamily } = input;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H, style);

  const rtl = !!lang.rtl;
  const marginX = W * 0.06;
  const textW = W * 0.5;

  // Phone on the opposite side of the text, bleeding off the bottom.
  const frameKind: FrameKind = "android-phone";
  const screenAspect = screenAspectOf(input, frameKind);
  const outerW = H * 0.62;
  const cx = rtl ? W * 0.24 : W * 0.76;
  drawDevice(ctx, { x: cx - outerW / 2, y: H * 0.14, outerW, screenAspect, frameKind, rotateDeg: rtl ? 8 : -8, shadowScale: H * 1.4 }, input);

  // App name (small) + headline
  const nameSize = H * 0.055 * style.textScale;
  const t = fitText(ctx, { headline: input.caption.headline, subheadline: input.caption.subheadline }, H * 0.11 * style.textScale, textW, 3, fontFamily, !!lang.noSpaces);
  const nameH = input.appName ? nameSize * 1.6 : 0;
  const top = (H - (nameH + t.height)) / 2;
  const tx = rtl ? W - marginX : marginX;
  const align: CanvasTextAlign = rtl ? "right" : "left";
  if (input.appName) {
    ctx.textBaseline = "top";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = align;
    ctx.font = `800 ${nameSize}px ${fontFamily}`;
    ctx.fillStyle = style.subColor;
    ctx.fillText(input.appName.toUpperCase(), tx, top);
  }
  drawText(ctx, t, tx, top + nameH, align, style, lang, fontFamily);

  if (input.watermark) drawWatermark(ctx, W, H, input.watermark, fontFamily, H * 1.4);
  ctx.restore();
}
