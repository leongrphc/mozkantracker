"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-sm text-muted">
        Veri kaynağına ulaşılamadı. Biraz sonra tekrar dene.
      </p>
      {error.digest ? (
        <p className="mt-1 text-xs text-muted">Kod: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink"
      >
        Tekrar dene
      </button>
    </div>
  );
}
