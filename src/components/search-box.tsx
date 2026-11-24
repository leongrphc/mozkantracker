import Form from "next/form";

export function SearchBox({
  defaultValue,
  compact = false,
  autoFocus = false,
}: {
  defaultValue?: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <Form action="/search" className="relative w-full" role="search">
      <label htmlFor={compact ? "q-compact" : "q"} className="sr-only">
        Dizi veya film ara
      </label>
      <input
        id={compact ? "q-compact" : "q"}
        name="q"
        type="search"
        required
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Dizi veya film adı yaz…"
        className={
          compact
            ? "w-full rounded-lg border border-line bg-surface py-2 pl-3 pr-20 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            : "w-full rounded-2xl border border-line bg-surface py-4 pl-5 pr-28 text-lg placeholder:text-muted focus:border-accent focus:outline-none"
        }
      />
      <button
        type="submit"
        className={
          compact
            ? "absolute right-1 top-1 bottom-1 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink hover:brightness-110"
            : "absolute right-2 top-2 bottom-2 rounded-xl bg-accent px-5 font-medium text-accent-ink hover:brightness-110"
        }
      >
        Ara
      </button>
    </Form>
  );
}
