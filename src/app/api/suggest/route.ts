import { NextResponse, type NextRequest } from "next/server";
import { hasTmdbCredentials, searchMulti } from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";
import { tvmCard, tvmSearch } from "@/lib/tvmaze";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json([]);

  try {
    const cards = hasTmdbCredentials()
      ? (await searchMulti(q)).results.map(toCard)
      : (await tvmSearch(q)).map(tvmCard);
    return NextResponse.json(cards.slice(0, 8), {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
