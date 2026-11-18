"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import PreviewCanvas from "./PreviewCanvas";
import { renderScreenshot } from "@/lib/render";
import { SIZES, sizeById } from "@/lib/sizes";
import { LANGUAGES, langByCode } from "@/lib/languages";
import { TEMPLATES } from "@/lib/templates";
import { PLANS, SITE } from "@/lib/site";
import type { Caption, ExportLayout, Layout, FrameStyle, Listing, Project, Screen, Style } from "@/lib/types";
import { LISTING_LIMITS } from "@/lib/types";
import { DEMO_PROJECT, DEMO_SIZE, demoScreen } from "@/lib/demo";
import type { Language } from "@/lib/languages";
import {
  deleteImage, loadImage, loadProject, newProject, saveImage, saveProject,
} from "@/lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

// Downscaled JPEG (base64, no prefix) for the AI caption writer.
function thumbForAi(img: HTMLImageElement): string {
  const maxH = 900;
  const scale = Math.min(1, maxH / img.naturalHeight);
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.75).split(",")[1];
}

function captionFor(p: Project, s: Screen, lang: string): Caption {
  if (lang === p.sourceLang) return s.caption;
  return p.translations[lang]?.[s.id] ?? s.caption;
}

const EMPTY_LISTING: Listing = { subtitle: "", promotionalText: "", keywords: "", description: "", playShortDescription: "" };

function listingText(appName: string, lang: Language, l: Listing): string {
  return [
    `${appName} — ${lang.name}`,
    "",
    "== App Store ==",
    `Subtitle (${l.subtitle.length}/30): ${l.subtitle}`,
    `Promotional text (${l.promotionalText.length}/170): ${l.promotionalText}`,
    `Keywords (${l.keywords.length}/100): ${l.keywords}`,
    "",
    "== Google Play ==",
    `Short description (${l.playShortDescription.length}/80): ${l.playShortDescription}`,
    "",
    "== Description (both stores) ==",
    l.description,
    "",
  ].join("\n");
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export default function Editor({ fontFamily }: { fontFamily: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [me, setMe] = useState<{ email: string } | null>(null);
  const [pro, setPro] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [sizeId, setSizeId] = useState(SIZES[0].id);
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [modal, setModal] = useState<null | "upgrade" | "languages" | "export">(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState<"screens" | "listing">("screens");
  const fileInput = useRef<HTMLInputElement>(null);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = (await res.json()) as { user: { email: string } | null; pro: boolean };
      setMe(data.user);
      setPro(data.pro);
    } catch {}
  }, []);

  const notify = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const p = await loadProject();
      const imgs: Record<string, HTMLImageElement> = {};
      for (const s of p.screens) {
        const src = await loadImage(s.imageKey);
        if (src) imgs[s.imageKey] = await loadImg(src).catch(() => null as unknown as HTMLImageElement);
      }
      setImages(imgs);
      setProject(p);
      setLang(p.sourceLang);
      if (new URLSearchParams(window.location.search).get("upgrade")) setModal("upgrade");
      refreshMe();
    })();
    const fam = fontFamily;
    Promise.all([document.fonts.load(`800 40px ${fam}`), document.fonts.load(`500 40px ${fam}`)])
      .catch(() => {})
      .finally(() => setFontsReady(true));
  }, [fontFamily, refreshMe]);

  // Autosave
  useEffect(() => {
    if (!project) return;
    const t = window.setTimeout(() => saveProject(project), 400);
    return () => window.clearTimeout(t);
  }, [project]);

  const limits = pro ? PLANS.pro : PLANS.free;
  const watermark = pro ? null : `Made with ${SITE.name}`;
  const size = sizeById(sizeId);
  const language = langByCode(lang);

  const update = useCallback((fn: (p: Project) => Project) => setProject((p) => (p ? fn(p) : p)), []);
  const updateStyle = (patch: Partial<Style>) => update((p) => ({ ...p, style: { ...p.style, ...patch } }));

  async function addFiles(files: FileList | File[]) {
    if (!project) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const room = limits.maxScreens - project.screens.length;
    if (room <= 0) {
      notify(pro ? "Stores allow at most 10 screenshots." : `Free plan: ${PLANS.free.maxScreens} screenshots. Upgrade for 10.`, "err");
      if (!pro) setModal("upgrade");
      return;
    }
    const accepted = list.slice(0, room);
    const newScreens: Screen[] = [];
    const newImgs: Record<string, HTMLImageElement> = {};
    for (const f of accepted) {
      if (f.size > 15 * 1024 * 1024) {
        notify(`${f.name} is larger than 15 MB.`, "err");
        continue;
      }
      const dataUrl = await readFile(f);
      const img = await loadImg(dataUrl).catch(() => null);
      if (!img) continue;
      const key = uid();
      await saveImage(key, dataUrl);
      newImgs[key] = img;
      newScreens.push({ id: uid(), imageKey: key, width: img.naturalWidth, height: img.naturalHeight, caption: { headline: "", subheadline: "" } });
    }
    setImages((m) => ({ ...m, ...newImgs }));
    update((p) => ({ ...p, screens: [...p.screens, ...newScreens] }));
    if (list.length > accepted.length && !pro) {
      notify(`Added ${accepted.length}. Free plan is limited to ${PLANS.free.maxScreens} screenshots.`, "err");
    }
  }

  async function loadExample() {
    const accent = "#6d28d9";
    const newScreens: Screen[] = [];
    const newImgs: Record<string, HTMLImageElement> = {};
    for (const d of DEMO_PROJECT.screens) {
      const dataUrl = demoScreen(d.kind, accent);
      const img = await loadImg(dataUrl);
      const key = uid();
      await saveImage(key, dataUrl);
      newImgs[key] = img;
      newScreens.push({ id: uid(), imageKey: key, width: DEMO_SIZE.width, height: DEMO_SIZE.height, caption: { ...d.caption } });
    }
    setImages((m) => ({ ...m, ...newImgs }));
    update((p) => ({ ...p, appName: DEMO_PROJECT.appName, appDescription: DEMO_PROJECT.appDescription, screens: newScreens }));
    notify("Example loaded. Try a template, then export.");
  }

  function removeScreen(id: string) {
    const s = project?.screens.find((x) => x.id === id);
    if (s) deleteImage(s.imageKey);
    update((p) => ({ ...p, screens: p.screens.filter((x) => x.id !== id) }));
  }

  function moveScreen(id: string, dir: -1 | 1) {
    update((p) => {
      const i = p.screens.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.screens.length) return p;
      const screens = [...p.screens];
      [screens[i], screens[j]] = [screens[j], screens[i]];
      return { ...p, screens };
    });
  }

  function editCaption(screenId: string, patch: Partial<Caption>) {
    update((p) => {
      if (lang === p.sourceLang) {
        return { ...p, screens: p.screens.map((s) => (s.id === screenId ? { ...s, caption: { ...s.caption, ...patch } } : s)) };
      }
      const s = p.screens.find((x) => x.id === screenId)!;
      const current = p.translations[lang]?.[screenId] ?? s.caption;
      return {
        ...p,
        translations: { ...p.translations, [lang]: { ...(p.translations[lang] || {}), [screenId]: { ...current, ...patch } } },
      };
    });
  }

  function editListing(patch: Partial<Listing>) {
    update((p) => ({ ...p, listings: { ...p.listings, [lang]: { ...EMPTY_LISTING, ...(p.listings[lang] || {}), ...patch } } }));
  }

  async function aiListing() {
    if (!project) return;
    if (!pro) return setModal("upgrade");
    if (!project.appDescription.trim() && !project.screens.some((s) => s.caption.headline.trim())) {
      return notify("Describe your app (left panel) or write captions first.", "err");
    }
    const langs = project.languages;
    setBusy("listing");
    setProgress(0);
    try {
      const captions = project.screens.map((s) => s.caption);
      let done = 0;
      for (let i = 0; i < langs.length; i += 2) {
        const batch = langs.slice(i, i + 2);
        const r = await api<{ listings: { lang: string; listing: Listing }[] }>(
          "/api/listing",
          { appName: project.appName, appDescription: project.appDescription, captions, langs: batch },
        );
        update((p) => {
          const listings = { ...p.listings };
          for (const l of r.listings) if (batch.includes(l.lang)) listings[l.lang] = l.listing;
          return { ...p, listings };
        });
        done += batch.length;
        setProgress(done / langs.length);
      }
      notify(`Listing written for ${langs.length} language${langs.length > 1 ? "s" : ""}.`);
    } catch (e) {
      notify((e as Error).message, "err");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  async function aiCaptions() {
    if (!project || !project.screens.length) return notify("Add screenshots first.", "err");
    setBusy("captions");
    try {
      const screens = project.screens.map((s) => ({
        image: images[s.imageKey] ? thumbForAi(images[s.imageKey]) : undefined,
        notes: s.caption.headline || undefined,
      }));
      const r = await api<{ captions: Caption[] }>("/api/captions", { appName: project.appName, appDescription: project.appDescription, screens });
      update((p) => ({
        ...p,
        screens: p.screens.map((s, i) => (r.captions[i] ? { ...s, caption: { headline: r.captions[i].headline, subheadline: r.captions[i].subheadline } } : s)),
      }));
      setLang(project.sourceLang);
      notify("Captions written. Edit anything you like.");
    } catch (e) {
      notify((e as Error).message, "err");
    } finally {
      setBusy(null);
    }
  }

  async function aiTranslate() {
    if (!project) return;
    if (!pro) return setModal("upgrade");
    const targets = project.languages.filter((l) => l !== project.sourceLang);
    if (!targets.length) return setModal("languages");
    if (!project.screens.length) return notify("Add screenshots first.", "err");
    if (project.screens.some((s) => !s.caption.headline.trim())) return notify("Write a headline for every screen first.", "err");
    setBusy("translate");
    setProgress(0);
    try {
      const captions = project.screens.map((s) => s.caption);
      const batches: string[][] = [];
      for (let i = 0; i < targets.length; i += 6) batches.push(targets.slice(i, i + 6));
      let done = 0;
      for (const batch of batches) {
        const r = await api<{ translations: { lang: string; captions: Caption[] }[] }>(
          "/api/translate",
          { appName: project.appName, sourceLang: project.sourceLang, targetLangs: batch, captions },
        );
        update((p) => {
          const translations = { ...p.translations };
          for (const t of r.translations) {
            if (!batch.includes(t.lang)) continue;
            const map: Record<string, Caption> = {};
            p.screens.forEach((s, i) => {
              if (t.captions[i]) map[s.id] = t.captions[i];
            });
            translations[t.lang] = map;
          }
          return { ...p, translations };
        });
        done += batch.length;
        setProgress(done / targets.length);
      }
      notify(`Translated into ${targets.length} languages.`);
    } catch (e) {
      notify((e as Error).message, "err");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  async function exportZip() {
    if (!project) return;
    if (!project.screens.length) return notify("Add screenshots first.", "err");
    const sizes = project.exportSizes.map(sizeById);
    if (!sizes.length) return notify("Pick at least one size.", "err");
    const langs = pro ? project.languages : [project.sourceLang];
    const fastlane = project.exportLayout === "fastlane";
    setBusy("export");
    setProgress(0);
    try {
      await document.fonts.load(`800 40px ${fontFamily}`).catch(() => {});
      const zip = new JSZip();
      const perLang = sizes.reduce((n, sz) => n + (sz.device === "feature-graphic" ? 1 : project.screens.length), 0);
      const total = langs.length * perLang;
      let n = 0;
      const canvas = document.createElement("canvas");
      const skipped = new Set<string>();
      for (const l of langs) {
        const language = langByCode(l);
        for (const sz of sizes) {
          const locale = sz.fastlane.platform === "ios" ? language.asc : language.play;
          if (fastlane && !locale) {
            skipped.add(`${language.name} (${sz.store})`);
            n += sz.device === "feature-graphic" ? 1 : project.screens.length;
            continue;
          }
          canvas.width = sz.width;
          canvas.height = sz.height;
          const ctx = canvas.getContext("2d")!;
          const count = sz.device === "feature-graphic" ? 1 : project.screens.length;
          for (let i = 0; i < count; i++) {
            const s = project.screens[i];
            renderScreenshot(ctx, {
              width: sz.width,
              height: sz.height,
              image: images[s.imageKey] ?? null,
              imageWidth: s.width,
              imageHeight: s.height,
              caption: captionFor(project, s, l),
              style: project.style,
              device: sz.device,
              lang: language,
              fontFamily,
              watermark,
              appName: project.appName,
            });
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
            const nn = String(i + 1).padStart(2, "0");
            let path: string;
            if (!fastlane) path = sz.device === "feature-graphic" ? `${l}/feature-graphic_1024x500.png` : `${l}/${sz.id}/${nn}_${sz.width}x${sz.height}.png`;
            else if (sz.fastlane.platform === "ios") path = `fastlane/screenshots/${locale}/${nn}_${sz.id}.png`;
            else if (sz.device === "feature-graphic") path = `fastlane/metadata/android/${locale}/images/featureGraphic.png`;
            else path = `fastlane/metadata/android/${locale}/images/${sz.fastlane.folder}/${i + 1}.png`;
            if (blob) zip.file(path, blob);
            n++;
            setProgress(n / total);
          }
        }
        // Store listing text
        const listing = project.listings[l];
        if (listing) {
          if (!fastlane) zip.file(`${l}/listing.txt`, listingText(project.appName, language, listing));
          else {
            if (language.asc) {
              const base = `fastlane/metadata/${language.asc}`;
              if (project.appName) zip.file(`${base}/name.txt`, project.appName);
              zip.file(`${base}/subtitle.txt`, listing.subtitle);
              zip.file(`${base}/promotional_text.txt`, listing.promotionalText);
              zip.file(`${base}/keywords.txt`, listing.keywords);
              zip.file(`${base}/description.txt`, listing.description);
            }
            if (language.play) {
              const base = `fastlane/metadata/android/${language.play}`;
              if (project.appName) zip.file(`${base}/title.txt`, project.appName.slice(0, 30));
              zip.file(`${base}/short_description.txt`, listing.playShortDescription);
              zip.file(`${base}/full_description.txt`, listing.description);
            }
          }
        }
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(project.appName || "app").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${fastlane ? "fastlane" : "screenshots"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      notify(skipped.size ? `Exported. Skipped (no store locale): ${[...skipped].join(", ")}` : `Exported ${total} images.`);
      setModal(null);
    } catch (e) {
      notify((e as Error).message || "Export failed.", "err");
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  function resetProject() {
    if (!project) return;
    if (!window.confirm("Start a new project? This removes the current screenshots and captions.")) return;
    project.screens.forEach((s) => deleteImage(s.imageKey));
    const p = newProject();
    setProject(p);
    setImages({});
    setLang(p.sourceLang);
  }

  const previewWidth = useMemo(() => (size.device === "feature-graphic" ? 560 : size.device.endsWith("tablet") ? 260 : 210), [size.device]);

  if (!project) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading editor…</div>;
  }

  const translated = (l: string) => l === project.sourceLang || !!project.translations[l];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-xs text-white">S</span>
          {SITE.name}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pro ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
          {pro ? "Pro" : "Free"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={resetProject} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">New</button>
          {me ? (
            <Link href="/account" className="hidden max-w-[180px] truncate rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 sm:block" title={me.email}>
              {me.email}
            </Link>
          ) : (
            <Link href="/login?next=/app" className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Sign in</Link>
          )}
          {!pro && (
            <button onClick={() => setModal("upgrade")} className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              Upgrade
            </button>
          )}
          <button
            onClick={() => setModal("export")}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Export ZIP
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[340px_1fr_300px]">
        {/* Left: content */}
        <aside className="space-y-5 border-b border-neutral-200 bg-white p-4 lg:h-[calc(100vh-61px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your app</h2>
            <input
              value={project.appName}
              onChange={(e) => update((p) => ({ ...p, appName: e.target.value }))}
              placeholder="App name"
              maxLength={80}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <textarea
              value={project.appDescription}
              onChange={(e) => update((p) => ({ ...p, appDescription: e.target.value }))}
              placeholder="What does your app do? Who is it for? (helps the AI write better captions)"
              rows={3}
              maxLength={1500}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </section>

          <section
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center text-sm transition ${dragOver ? "border-indigo-500 bg-indigo-50" : "border-neutral-300 hover:border-neutral-400"}`}
          >
            <p className="font-semibold">Drop screenshots here</p>
            <p className="mt-1 text-xs text-neutral-500">
              or click to upload · {project.screens.length}/{limits.maxScreens} used
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </section>
          {project.screens.length === 0 && (
            <button onClick={loadExample} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50">
              No screenshots handy? Try an example app
            </button>
          )}

          <button
            onClick={aiCaptions}
            disabled={!!busy}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {busy === "captions" ? "Writing captions…" : "✨ Write captions with AI"}
          </button>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Captions</h2>
              <span className="text-xs text-neutral-500">Editing: {language.name}</span>
            </div>
            {project.screens.length === 0 && <p className="text-sm text-neutral-500">No screenshots yet.</p>}
            {project.screens.map((s, i) => {
              const c = captionFor(project, s, lang);
              const img = images[s.imageKey];
              return (
                <div key={s.id} className="flex gap-3 rounded-xl border border-neutral-200 p-2">
                  <div className="w-12 shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.src} alt={`Screenshot ${i + 1}`} className="w-12 rounded-md object-cover ring-1 ring-black/10" />
                    ) : (
                      <div className="h-20 w-12 rounded-md bg-neutral-200" />
                    )}
                    <div className="mt-1 flex justify-center gap-1 text-xs text-neutral-500">
                      <button aria-label="Move up" onClick={() => moveScreen(s.id, -1)} className="hover:text-neutral-900">↑</button>
                      <button aria-label="Move down" onClick={() => moveScreen(s.id, 1)} className="hover:text-neutral-900">↓</button>
                      <button aria-label="Remove" onClick={() => removeScreen(s.id)} className="hover:text-red-600">✕</button>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input
                      value={c.headline}
                      onChange={(e) => editCaption(s.id, { headline: e.target.value })}
                      placeholder={`Headline ${i + 1}`}
                      dir={language.rtl ? "rtl" : "ltr"}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm font-semibold"
                    />
                    <textarea
                      value={c.subheadline}
                      onChange={(e) => editCaption(s.id, { subheadline: e.target.value })}
                      placeholder="Subheadline (optional)"
                      rows={2}
                      dir={language.rtl ? "rtl" : "ltr"}
                      className="w-full resize-none rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Languages</h2>
              <button onClick={() => (pro ? setModal("languages") : setModal("upgrade"))} className="text-xs font-semibold text-indigo-700">
                + Add {pro ? "" : "🔒"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.languages.map((l) => (
                <span key={l} className={`rounded-full px-2 py-0.5 text-xs ${translated(l) ? "bg-neutral-900 text-white" : "bg-amber-100 text-amber-800"}`}>
                  {langByCode(l).name}
                </span>
              ))}
            </div>
            {project.languages.length > 1 && (
              <button
                onClick={aiTranslate}
                disabled={!!busy}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60"
              >
                {busy === "translate" ? `Translating… ${Math.round((progress ?? 0) * 100)}%` : "🌍 Translate captions with AI"}
              </button>
            )}
          </section>
        </aside>

        {/* Center: preview / listing */}
        <main className="min-w-0 p-4 lg:h-[calc(100vh-61px)] lg:overflow-y-auto">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-neutral-200/70 p-1">
              {([["screens", "Screenshots"], ["listing", "Store listing text"]] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-white shadow-sm" : "text-neutral-600"}`}
                >
                  {label}
                  {v === "listing" && !pro ? " 🔒" : ""}
                </button>
              ))}
            </div>
            {view === "screens" && (
              <select value={sizeId} onChange={(e) => setSizeId(e.target.value)} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
                {SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.store} · {s.label} ({s.width}×{s.height})
                  </option>
                ))}
              </select>
            )}
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">
              {project.languages.map((l) => (
                <option key={l} value={l}>
                  {langByCode(l).name}
                  {view === "screens" && !translated(l) ? " (not translated yet)" : ""}
                  {view === "listing" && !project.listings[l] ? " (not written yet)" : ""}
                </option>
              ))}
            </select>
            {view === "screens" && <span className="text-xs text-neutral-500">{size.note}</span>}
          </div>

          {view === "screens" ? (
            <div className="flex flex-wrap gap-4">
              {(project.screens.length ? (size.device === "feature-graphic" ? project.screens.slice(0, 1) : project.screens) : [null]).map((s) => (
                <PreviewCanvas
                  key={s?.id ?? "empty"}
                  size={size}
                  image={s ? images[s.imageKey] ?? null : null}
                  imageWidth={s?.width ?? 0}
                  imageHeight={s?.height ?? 0}
                  caption={s ? captionFor(project, s, lang) : { headline: "Your headline here", subheadline: "Upload a screenshot to begin" }}
                  style={project.style}
                  lang={language}
                  fontFamily={fontFamily}
                  watermark={watermark}
                  displayWidth={previewWidth}
                  fontsReady={fontsReady}
                  appName={project.appName}
                />
              ))}
            </div>
          ) : (
            <ListingPanel
              listing={project.listings[lang]}
              lang={language}
              pro={pro}
              busy={busy === "listing"}
              progress={progress}
              languageCount={project.languages.length}
              onGenerate={aiListing}
              onChange={editListing}
              onCopy={(text) => {
                navigator.clipboard?.writeText(text).then(
                  () => notify("Copied."),
                  () => notify("Could not copy.", "err"),
                );
              }}
            />
          )}
        </main>

        {/* Right: style */}
        <aside className="space-y-5 border-t border-neutral-200 bg-white p-4 lg:h-[calc(100vh-61px)] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Templates</h2>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateStyle({ templateId: t.id, ...t.style })}
                  className={`group flex flex-col items-center gap-1 text-[11px] ${project.style.templateId === t.id ? "font-semibold" : "text-neutral-600"}`}
                >
                  <span
                    className={`h-14 w-full rounded-lg ring-offset-2 ${project.style.templateId === t.id ? "ring-2 ring-indigo-600" : "ring-1 ring-black/10"}`}
                    style={{ background: `linear-gradient(${t.style.bgAngle}deg, ${t.style.bgFrom}, ${t.style.bgTo})` }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </section>

          <Segmented<Layout>
            label="Layout"
            value={project.style.layout}
            onChange={(layout) => updateStyle({ layout })}
            options={[["text-top", "Top"], ["text-bottom", "Bottom"], ["bleed", "Bleed"], ["tilt", "Tilted"]]}
          />
          <Segmented<FrameStyle>
            label="Frame"
            value={project.style.frame}
            onChange={(frame) => updateStyle({ frame })}
            options={[["device", "Device"], ["plain", "Rounded"], ["none", "None"]]}
          />
          <Segmented<"center" | "left">
            label="Text align"
            value={project.style.align}
            onChange={(align) => updateStyle({ align })}
            options={[["center", "Center"], ["left", "Left"]]}
          />

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Colors</h2>
            <ColorRow label="Background top" value={project.style.bgFrom} onChange={(v) => updateStyle({ bgFrom: v })} />
            <ColorRow label="Background bottom" value={project.style.bgTo} onChange={(v) => updateStyle({ bgTo: v })} />
            <ColorRow label="Headline" value={project.style.textColor} onChange={(v) => updateStyle({ textColor: v })} />
            <ColorRow label="Subheadline" value={project.style.subColor} onChange={(v) => updateStyle({ subColor: v })} />
            <ColorRow label="Device frame" value={project.style.frameColor} onChange={(v) => updateStyle({ frameColor: v })} />
          </section>

          <section className="space-y-3">
            <Slider label="Gradient angle" min={0} max={360} step={5} value={project.style.bgAngle} onChange={(v) => updateStyle({ bgAngle: v })} suffix="°" />
            <Slider label="Text size" min={0.7} max={1.4} step={0.05} value={project.style.textScale} onChange={(v) => updateStyle({ textScale: v })} suffix="×" />
          </section>
        </aside>
      </div>

      {/* Modals */}
      {modal === "upgrade" && <UpgradeModal onClose={() => setModal(null)} signedIn={!!me} />}
      {modal === "languages" && (
        <Modal title="Languages" onClose={() => setModal(null)}>
          <p className="mb-3 text-sm text-neutral-600">Pick the store languages you want. Then hit “Translate captions with AI”.</p>
          <div className="grid max-h-[50vh] grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
            {LANGUAGES.map((l) => {
              const on = project.languages.includes(l.code);
              const isSource = l.code === project.sourceLang;
              return (
                <label key={l.code} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${on ? "bg-indigo-50" : ""}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={isSource}
                    onChange={() =>
                      update((p) => ({
                        ...p,
                        languages: on ? p.languages.filter((x) => x !== l.code) : [...p.languages, l.code].slice(0, PLANS.pro.maxLanguages),
                      }))
                    }
                  />
                  {l.name}
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setModal(null)} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Done</button>
          </div>
        </Modal>
      )}
      {modal === "export" && (
        <Modal title="Export screenshots" onClose={() => (busy === "export" ? null : setModal(null))}>
          {(["App Store", "Google Play"] as const).map((store) => (
            <div key={store} className="mb-3">
              <h3 className="mb-1 text-sm font-semibold">{store}</h3>
              {SIZES.filter((s) => s.store === store).map((s) => {
                const on = project.exportSizes.includes(s.id);
                return (
                  <label key={s.id} className="flex items-start gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={on}
                      onChange={() =>
                        update((p) => ({ ...p, exportSizes: on ? p.exportSizes.filter((x) => x !== s.id) : [...p.exportSizes, s.id] }))
                      }
                    />
                    <span>
                      {s.label} <span className="text-neutral-500">{s.width}×{s.height}</span>
                      <span className="block text-xs text-neutral-500">{s.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
          <Segmented<ExportLayout>
            label="Folder layout"
            value={project.exportLayout}
            onChange={(exportLayout) => update((p) => ({ ...p, exportLayout }))}
            options={[["simple", "Simple folders"], ["fastlane", "fastlane-ready"]]}
          />
          <p className="mb-3 mt-1 text-xs text-neutral-500">
            {project.exportLayout === "fastlane"
              ? "Matches fastlane deliver (iOS) and supply (Android): screenshots plus listing text, ready to upload with one command."
              : "One folder per language and size. Listing text is included as listing.txt when written."}
          </p>
          <p className="text-sm text-neutral-600">
            {(() => {
              const langs = pro ? project.languages.length : 1;
              const perLang = project.exportSizes.map(sizeById).reduce((n, sz) => n + (sz.device === "feature-graphic" ? 1 : project.screens.length), 0);
              return (
                <>
                  {langs} language{langs > 1 ? "s" : ""} × {perLang} images = <b>{langs * perLang} images</b>
                  {pro && Object.keys(project.listings).length > 0 && <> + listing text for {Object.keys(project.listings).length} languages</>}
                </>
              );
            })()}
          </p>
          {!pro && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              Free exports include a small “{watermark}” badge and only your source language.{" "}
              <button className="font-semibold underline" onClick={() => setModal("upgrade")}>Upgrade to remove it</button>
            </p>
          )}
          {progress !== null && busy === "export" && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setModal(null)} disabled={busy === "export"} className="rounded-lg px-4 py-2 text-sm">Cancel</button>
            <button onClick={exportZip} disabled={!!busy} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy === "export" ? `Rendering… ${Math.round((progress ?? 0) * 100)}%` : "Download ZIP"}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${toast.kind === "err" ? "bg-red-600" : "bg-neutral-900"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string>(props: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{props.label}</h2>
      <div className="flex rounded-lg bg-neutral-100 p-1">
        {props.options.map(([v, label]) => (
          <button
            key={v}
            onClick={() => props.onChange(v)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${props.value === v ? "bg-white shadow-sm" : "text-neutral-600"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ColorRow(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-neutral-700">{props.label}</span>
      <input type="color" value={props.value} onChange={(e) => props.onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-neutral-300 bg-white" />
    </label>
  );
}

function Slider(props: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-neutral-700">
        {props.label}
        <span className="text-neutral-500">
          {props.value}
          {props.suffix}
        </span>
      </span>
      <input type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

function Modal(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={props.onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{props.title}</h2>
          <button onClick={props.onClose} aria-label="Close" className="text-neutral-500 hover:text-neutral-900">✕</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function UpgradeModal(props: { onClose: () => void; signedIn: boolean }) {
  const plan = (id: string) => `/api/checkout?plan=${id}`;
  return (
    <Modal title={`Upgrade to ${SITE.name} Pro`} onClose={props.onClose}>
      <ul className="mb-4 space-y-1 text-sm text-neutral-700">
        <li>✓ Up to 10 screenshots per project</li>
        <li>✓ AI translation into 40 languages</li>
        <li>✓ AI store listing text (subtitle, keywords, descriptions) in every language</li>
        <li>✓ fastlane-ready export, no watermark</li>
        <li>✓ Unlimited AI captions (fair use)</li>
      </ul>
      <div className="grid grid-cols-3 gap-2">
        <a href={plan("monthly")} className="rounded-xl border border-neutral-300 p-3 text-center hover:border-indigo-600">
          <div className="text-lg font-bold">$12</div>
          <div className="text-xs text-neutral-500">per month</div>
        </a>
        <a href={plan("yearly")} className="rounded-xl border-2 border-indigo-600 p-3 text-center">
          <div className="text-lg font-bold">$79</div>
          <div className="text-xs text-neutral-500">per year · save 45%</div>
        </a>
        <a href={plan("lifetime")} className="rounded-xl border border-neutral-300 p-3 text-center hover:border-indigo-600">
          <div className="text-lg font-bold">$49</div>
          <div className="text-xs text-neutral-500">lifetime (launch)</div>
        </a>
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        {props.signedIn
          ? "Secure checkout by Lemon Squeezy. Pro unlocks on your account right after payment. Cancel anytime."
          : "You'll sign in with your email first, so Pro is linked to your account on every device. Secure checkout by Lemon Squeezy."}{" "}
        Your current project stays saved in this browser.
      </p>
    </Modal>
  );
}

const LISTING_FIELDS: { key: keyof Listing; label: string; store: string; rows: number; hint: string }[] = [
  { key: "subtitle", label: "Subtitle", store: "App Store", rows: 1, hint: "Shown under your app name." },
  { key: "promotionalText", label: "Promotional text", store: "App Store", rows: 3, hint: "Can be changed anytime without a new release." },
  { key: "keywords", label: "Keywords", store: "App Store", rows: 2, hint: "Comma-separated, no spaces. Hidden from users, used for search." },
  { key: "playShortDescription", label: "Short description", store: "Google Play", rows: 2, hint: "Shown at the top of your Play listing." },
  { key: "description", label: "Description", store: "Both stores", rows: 14, hint: "The full description." },
];

function ListingPanel(props: {
  listing: Listing | undefined;
  lang: Language;
  pro: boolean;
  busy: boolean;
  progress: number | null;
  languageCount: number;
  onGenerate: () => void;
  onChange: (patch: Partial<Listing>) => void;
  onCopy: (text: string) => void;
}) {
  const l = props.listing ?? EMPTY_LISTING;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="text-sm text-indigo-900">
          AI writes your App Store and Google Play listing text for <b>{props.languageCount} language{props.languageCount > 1 ? "s" : ""}</b>, with
          keywords people actually search for in each market. It is included in your export (and in fastlane format).
        </p>
        <button
          onClick={props.onGenerate}
          disabled={props.busy}
          className="mt-3 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {props.busy ? `Writing… ${Math.round((props.progress ?? 0) * 100)}%` : props.pro ? "✨ Write listing for all languages" : "🔒 Unlock with Pro"}
        </button>
      </div>
      {LISTING_FIELDS.map((f) => {
        const value = l[f.key];
        const max = LISTING_LIMITS[f.key];
        const over = value.length > max;
        return (
          <label key={f.key} className="block rounded-xl border border-neutral-200 bg-white p-3">
            <span className="flex items-center justify-between text-sm">
              <span>
                <b>{f.label}</b> <span className="text-xs text-neutral-500">· {f.store}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`text-xs ${over ? "font-semibold text-red-600" : "text-neutral-500"}`}>
                  {value.length}/{max}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    props.onCopy(value);
                  }}
                  className="text-xs font-semibold text-indigo-700"
                >
                  Copy
                </button>
              </span>
            </span>
            <textarea
              value={value}
              rows={f.rows}
              dir={props.lang.rtl ? "rtl" : "ltr"}
              onChange={(e) => props.onChange({ [f.key]: e.target.value } as Partial<Listing>)}
              className={`mt-2 w-full rounded-md border px-2 py-1.5 text-sm ${over ? "border-red-400" : "border-neutral-300"}`}
            />
            <span className="text-xs text-neutral-500">{f.hint}</span>
          </label>
        );
      })}
    </div>
  );
}
