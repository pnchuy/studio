import type { Genre } from '@/types';
import genresData from '@/data/genres.json';

export async function getAllGenres(): Promise<Genre[]> {
  // We keep the async signature to avoid changing all call sites.
  return Promise.resolve(genresData as Genre[]);
}

export async function getGenresByIds(ids: string[]): Promise<Genre[]> {
    const genres = genresData as Genre[];
    if (!ids) return [];
    const foundGenres = genres.filter(genre => ids.includes(genre.id));
    return Promise.resolve(foundGenres);
}
