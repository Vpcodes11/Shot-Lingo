"use client";
import { get, set, del } from "idb-keyval";
import type { Project } from "./types";
import { defaultStyle } from "./templates";
import { SIZES } from "./sizes";

const PROJECT_KEY = "shotlingo:project:v1";

export const newProject = (): Project => ({
  version: 1,
  appName: "",
  appDescription: "",
  sourceLang: "en",
  screens: [],
  style: defaultStyle(),
  languages: ["en"],
  translations: {},
  exportSizes: SIZES.filter((s) => s.defaultOn).map((s) => s.id),
  exportLayout: "simple",
  listings: {},
});

export async function loadProject(): Promise<Project> {
  try {
    const p = (await get(PROJECT_KEY)) as Project | undefined;
    if (p && p.version === 1) return { ...newProject(), ...p, style: { ...defaultStyle(), ...p.style } };
  } catch {}
  return newProject();
}

export async function saveProject(p: Project) {
  try {
    await set(PROJECT_KEY, p);
  } catch {}
}

export async function saveImage(key: string, dataUrl: string) {
  try {
    await set(`shotlingo:img:${key}`, dataUrl);
  } catch {}
}

export async function loadImage(key: string): Promise<string | undefined> {
  try {
    return (await get(`shotlingo:img:${key}`)) as string | undefined;
  } catch {
    return undefined;
  }
}

export async function deleteImage(key: string) {
  try {
    await del(`shotlingo:img:${key}`);
  } catch {}
}
