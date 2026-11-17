import type { Style } from "./types";

export interface Template {
  id: string;
  name: string;
  style: Omit<Style, "templateId" | "textScale">;
}

export const TEMPLATES: Template[] = [
  { id: "midnight", name: "Midnight", style: { bgFrom: "#1e1b4b", bgTo: "#4c1d95", bgAngle: 160, textColor: "#ffffff", subColor: "#c4b5fd", frameColor: "#0b0b10", layout: "text-top", frame: "device", align: "center" } },
  { id: "sunrise", name: "Sunrise", style: { bgFrom: "#f97316", bgTo: "#db2777", bgAngle: 150, textColor: "#ffffff", subColor: "#ffe4e6", frameColor: "#111111", layout: "bleed", frame: "device", align: "center" } },
  { id: "mint", name: "Mint", style: { bgFrom: "#d1fae5", bgTo: "#a7f3d0", bgAngle: 180, textColor: "#064e3b", subColor: "#047857", frameColor: "#1f2937", layout: "text-top", frame: "device", align: "center" } },
  { id: "paper", name: "Paper", style: { bgFrom: "#fafaf9", bgTo: "#e7e5e4", bgAngle: 180, textColor: "#1c1917", subColor: "#57534e", frameColor: "#1c1917", layout: "text-top", frame: "device", align: "left" } },
  { id: "ocean", name: "Ocean", style: { bgFrom: "#0ea5e9", bgTo: "#1e40af", bgAngle: 135, textColor: "#ffffff", subColor: "#e0f2fe", frameColor: "#0f172a", layout: "tilt", frame: "device", align: "center" } },
  { id: "noir", name: "Noir", style: { bgFrom: "#000000", bgTo: "#262626", bgAngle: 180, textColor: "#ffffff", subColor: "#a3a3a3", frameColor: "#3f3f46", layout: "bleed", frame: "device", align: "center" } },
  { id: "lemon", name: "Lemon", style: { bgFrom: "#fef08a", bgTo: "#facc15", bgAngle: 170, textColor: "#422006", subColor: "#713f12", frameColor: "#1c1917", layout: "text-bottom", frame: "device", align: "center" } },
  { id: "clean", name: "Clean", style: { bgFrom: "#eef2ff", bgTo: "#ffffff", bgAngle: 180, textColor: "#111827", subColor: "#4b5563", frameColor: "#111827", layout: "text-top", frame: "plain", align: "center" } },
];

export const defaultStyle = (): Style => ({
  templateId: TEMPLATES[0].id,
  textScale: 1,
  ...TEMPLATES[0].style,
});
