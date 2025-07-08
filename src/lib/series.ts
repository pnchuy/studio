import type { Series } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAllSeries(): Promise<Series[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const seriesCol = collection(db, 'series');
    const seriesSnapshot = await getDocs(seriesCol);
    return seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
  } catch (error) {
    console.error("Error fetching all series:", error);
    return [];
  }
}
