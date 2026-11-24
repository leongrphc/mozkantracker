import type { Metadata } from "next";
import { Calendar } from "./calendar";

export const metadata: Metadata = { title: "Takvim" };

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl sm:text-5xl">Takvim</h1>
      <p className="mt-1 text-sm text-muted">
        Listendeki dizilerin sıradaki ve yaklaşan bölümleri.
      </p>
      <Calendar />
    </div>
  );
}
