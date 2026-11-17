"use client";
// Generates fake app screens so visitors can try the product without their own screenshots.

const W = 645;
const H = 1398;

function base(accent: string, title: string, sub: string) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  x.fillStyle = "#f8fafc";
  x.fillRect(0, 0, W, H);
  x.fillStyle = accent;
  x.fillRect(0, 0, W, 360);
  x.fillStyle = "rgba(255,255,255,0.95)";
  x.font = "800 52px system-ui, sans-serif";
  x.fillText(title, 48, 220);
  x.font = "500 30px system-ui, sans-serif";
  x.fillStyle = "rgba(255,255,255,0.8)";
  x.fillText(sub, 48, 275);
  return { c, x };
}

function card(x: CanvasRenderingContext2D, y: number, h: number) {
  x.fillStyle = "#ffffff";
  x.beginPath();
  x.roundRect(36, y, W - 72, h, 28);
  x.fill();
}

export function demoScreen(kind: "tasks" | "stats" | "focus", accent: string): string {
  if (kind === "tasks") {
    const { c, x } = base(accent, "Good morning", "3 tasks left today");
    ["Design review", "Ship v2.1", "Reply to Maya", "Gym · 6pm", "Plan Q3"].forEach((r, i) => {
      const y = 410 + i * 170;
      card(x, y, 140);
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
    return c.toDataURL("image/png");
  }
  if (kind === "stats") {
    const { c, x } = base(accent, "Your week", "12 tasks done · 5 day streak");
    card(x, 410, 520);
    const bars = [0.4, 0.7, 0.55, 0.9, 0.65, 0.8, 0.3];
    bars.forEach((b, i) => {
      const bw = 52;
      const gap = (W - 72 - 80 - bw * 7) / 6;
      const bx = 76 + i * (bw + gap);
      const bh = 380 * b;
      x.fillStyle = i === 3 ? accent : "#cbd5e1";
      x.beginPath();
      x.roundRect(bx, 870 - bh, bw, bh, 14);
      x.fill();
    });
    x.fillStyle = "#0f172a";
    x.font = "700 34px system-ui, sans-serif";
    x.fillText("Completed", 76, 470);
    [["Focus time", "14h 20m"], ["Best day", "Thursday"]].forEach(([k, v], i) => {
      const y = 970 + i * 170;
      card(x, y, 140);
      x.fillStyle = "#94a3b8";
      x.font = "500 26px system-ui, sans-serif";
      x.fillText(k, 76, y + 55);
      x.fillStyle = "#0f172a";
      x.font = "800 40px system-ui, sans-serif";
      x.fillText(v, 76, y + 105);
    });
    return c.toDataURL("image/png");
  }
  const { c, x } = base(accent, "Focus", "Deep work session");
  card(x, 410, 760);
  x.strokeStyle = "#e2e8f0";
  x.lineWidth = 34;
  x.beginPath();
  x.arc(W / 2, 760, 200, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = accent;
  x.lineCap = "round";
  x.beginPath();
  x.arc(W / 2, 760, 200, -Math.PI / 2, Math.PI * 0.9);
  x.stroke();
  x.fillStyle = "#0f172a";
  x.font = "800 96px system-ui, sans-serif";
  x.textAlign = "center";
  x.fillText("18:42", W / 2, 790);
  x.fillStyle = accent;
  x.beginPath();
  x.roundRect(120, 1220, W - 240, 110, 55);
  x.fill();
  x.fillStyle = "#ffffff";
  x.font = "700 36px system-ui, sans-serif";
  x.fillText("Pause", W / 2, 1288);
  return c.toDataURL("image/png");
}

export const DEMO_SIZE = { width: W, height: H };

export const DEMO_PROJECT = {
  appName: "Taskly",
  appDescription:
    "Taskly is a simple to-do and focus app for busy professionals. Smart lists sort tasks by priority, a focus timer blocks distractions, and weekly stats show progress and streaks.",
  screens: [
    { kind: "tasks" as const, caption: { headline: "Plan your day in seconds", subheadline: "Smart lists that sort themselves" } },
    { kind: "stats" as const, caption: { headline: "See your progress", subheadline: "Weekly stats and streaks keep you going" } },
    { kind: "focus" as const, caption: { headline: "Focus without distractions", subheadline: "A timer built for deep work" } },
  ],
};
