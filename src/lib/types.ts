export type Layout = "text-top" | "text-bottom" | "bleed" | "tilt";
export type FrameStyle = "device" | "plain" | "none";

export interface Style {
  templateId: string;
  bgFrom: string;
  bgTo: string;
  bgAngle: number; // degrees
  textColor: string;
  subColor: string;
  frameColor: string;
  layout: Layout;
  frame: FrameStyle;
  textScale: number; // 0.7 – 1.4
  align: "center" | "left";
}

export interface Caption {
  headline: string;
  subheadline: string;
}

export interface Screen {
  id: string;
  imageKey: string; // IndexedDB key of the screenshot data URL
  width: number;
  height: number;
  caption: Caption; // source language (English by default)
}

export interface Project {
  version: 1;
  appName: string;
  appDescription: string;
  sourceLang: string;
  screens: Screen[];
  style: Style;
  languages: string[]; // target languages incl. source
  // translations[lang][screenId] = Caption
  translations: Record<string, Record<string, Caption>>;
  exportSizes: string[];
}
