import type { NormalizedCast } from "@/components/details";
import type { PosterCardData } from "@/components/poster-card";
import { img, titleOf, yearOf, type CastMember, type SearchItem } from "@/lib/tmdb";

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

export function tmdbCast(cast?: CastMember[]): NormalizedCast[] {
  return (cast ?? []).map((c) => ({
    key: `${c.id}-${c.character}`,
    name: c.name,
    character: c.character,
    photo: img(c.profile_path, "w185"),
  }));
}
