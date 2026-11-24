import type { PosterCardData } from "@/components/poster-card";
import { img, titleOf, yearOf, type SearchItem } from "@/lib/tmdb";

export function toCard(i: SearchItem): PosterCardData {
  return {
    id: i.id,
    type: i.media_type === "tv" ? "tv" : "movie",
    title: titleOf(i),
    year: yearOf(i.release_date ?? i.first_air_date),
    poster: img(i.poster_path, "w342"),
    rating: i.vote_average || undefined,
  };
}
