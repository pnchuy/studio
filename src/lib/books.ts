import type { Book, BookWithDetails } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit as firestoreLimit, startAfter, documentId, where, limit } from 'firebase/firestore';
import { getAllAuthors } from './authors';
import { getAllGenres } from './genres';

export async function getAllBooks(): Promise<Book[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const booksCol = collection(db, 'books');
    const bookSnapshot = await getDocs(booksCol);
    return bookSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: data.id || doc.id, // Fallback to doc.id if custom id doesn't exist
            docId: doc.id
        } as Book;
    }).filter(book => book.id);
  } catch (error) {
    console.error("Error fetching all books:", error);
    return [];
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const booksRef = collection(db, 'books');
    // First, try to find by custom ID
    let q = query(booksRef, where("id", "==", id), limit(1));
    let querySnapshot = await getDocs(q);

    // If not found, try to find by Firestore document ID (for backward compatibility)
    if (querySnapshot.empty) {
        const bookDocRef = doc(db, 'books', id);
        const bookDoc = await getDoc(bookDocRef);
        if (bookDoc.exists()) {
            const data = bookDoc.data();
            return {
                ...data,
                id: data.id || bookDoc.id,
                docId: bookDoc.id,
            } as Book;
        }
        return null;
    }
    
    const docSnapshot = querySnapshot.docs[0];
    return { ...docSnapshot.data(), docId: docSnapshot.id } as Book;

  } catch (error) {
    console.error(`Error fetching book by id ${id}:`, error);
    return null;
  }
}

const BOOKS_PER_PAGE = 10;

// Note: This implementation fetches all books for simplicity.
// For large datasets, a more sophisticated pagination strategy with cursors would be needed.
export async function getPaginatedBooksWithDetails({ page = 1, limit = BOOKS_PER_PAGE }: { page?: number; limit?: number }) {
  const allBooks = await getAllBooks();
  const allAuthors = await getAllAuthors();
  const allGenres = await getAllGenres();
  
  const totalBooks = allBooks.length;
  const totalPages = Math.ceil(totalBooks / limit);
  const offset = (page - 1) * limit;

  const paginatedBooks = allBooks.slice(offset, offset + limit);

  const booksWithDetails: BookWithDetails[] = paginatedBooks.map(book => {
    const author = allAuthors.find(a => a.id === book.authorId);
    const genres = allGenres.filter(g => book.genreIds && book.genreIds.includes(g.id));
    return {
      ...book,
      author,
      genres,
    };
  });

  return {
    books: booksWithDetails,
    hasMore: page < totalPages,
    totalPages,
    totalBooks,
  };
}
