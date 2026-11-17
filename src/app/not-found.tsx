import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="text-neutral-600">The page you are looking for does not exist.</p>
      <Link href="/" className="rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white">Go home</Link>
    </div>
  );
}
