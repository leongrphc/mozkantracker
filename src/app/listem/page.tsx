import type { Metadata } from "next";
import { MyList } from "./my-list";

export const metadata: Metadata = { title: "Listem" };

export default function ListPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl sm:text-5xl">Listem</h1>
      <p className="mt-1 text-sm text-muted">
        Listen bu tarayıcıda saklanır. Yedeklemek için dışa aktarabilirsin.
      </p>
      <MyList />
    </div>
  );
}
