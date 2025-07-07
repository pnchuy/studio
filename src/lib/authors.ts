import type { Author } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function getAllAuthors(): Promise<Author[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const authorsCol = collection(db, 'authors');
    const authorSnapshot = await getDocs(authorsCol);
    return authorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
  } catch (error) {
    console.error("Error fetching all authors:", error);
    return [];
  }
}

export async function getAuthorById(id: string): Promise<Author | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const authorDocRef = doc(db, 'authors', id);
    const authorDoc = await getDoc(authorDocRef);
    if (authorDoc.exists()) {
      return { id: authorDoc.id, ...authorDoc.data() } as Author;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching author by id ${id}:`, error);
    return null;
  }
}
