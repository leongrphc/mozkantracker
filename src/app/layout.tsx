import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const display = Instrument_Serif({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "mozkantracker",
    template: "%s · mozkantracker",
  },
  description:
    "Dizi ve filmleri ara, Türkiye'de hangi platformda izleyebileceğini gör, izlediklerini takip et.",
  appleWebApp: { capable: true, title: "mozkantracker", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="font-display text-2xl leading-none tracking-tight"
            >
              mozkan<span className="text-accent">tracker</span>
            </Link>
            <div className="hidden flex-1 sm:block">
              <SearchBox compact />
            </div>
            <nav className="ml-auto flex items-center text-sm sm:ml-0">
              {[
                ["/kesfet", "Keşfet"],
                ["/takvim", "Takvim"],
                ["/listem", "Listem"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-2 py-2 text-muted hover:bg-surface hover:text-fg sm:px-3"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <SearchBox compact />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted">
            Veriler{" "}
            <a
              href="https://www.themoviedb.org"
              className="underline hover:text-fg"
              target="_blank"
              rel="noreferrer"
            >
              TMDB
            </a>{" "}
            ve{" "}
            <a
              href="https://www.justwatch.com/tr"
              className="underline hover:text-fg"
              target="_blank"
              rel="noreferrer"
            >
              JustWatch
            </a>{" "}
            kaynaklıdır. Bu ürün TMDB API&apos;sini kullanır ancak TMDB
            tarafından onaylanmamıştır.
          </div>
        </footer>
      </body>
    </html>
  );
}
