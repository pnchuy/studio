import type { Genre } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAllGenres(): Promise<Genre[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const genresCol = collection(db, 'genres');
    const genreSnapshot = await getDocs(genresCol);
    return genreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Genre));
  } catch (error) {
    console.error("Error fetching all genres:", error);
    return [];
  }
}

export async function getGenresByIds(ids: string[]): Promise<Genre[]> {
    if (!isFirebaseConfigured || !db || !ids || ids.length === 0) return [];
    try {
      const allGenres = await getAllGenres();
      return allGenres.filter(genre => ids.includes(genre.id));
    } catch (error) {
      console.error(`Error fetching genres by ids:`, error);
      return [];
    }
}
