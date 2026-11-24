import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl">Burada bir şey yok</h1>
      <p className="mt-2 text-muted">Aradığın dizi ya da film bulunamadı.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
