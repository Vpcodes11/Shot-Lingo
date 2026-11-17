import type { Metadata } from "next";
import Editor from "@/components/Editor";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = { title: "Editor", robots: { index: false } };

export default function AppPage() {
  return <Editor fontFamily={inter.style.fontFamily} />;
}
