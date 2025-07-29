import type { Book, BookWithDetails, YoutubeLink } from '@/types';
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
        // Backward compatibility for old youtubeLink structure
        const youtubeLinks = (data.youtubeLinks || (data.youtubeLink || [])).map((link: string | YoutubeLink) => {
          if (typeof link === 'string') {
            return { url: link, chapters: '' };
          }
          return link;
        });

        return {
            ...data,
            id: data.id || doc.id,
            docId: doc.id,
            coverImages: data.coverImages || {
                size250: "https://placehold.co/250x375.png",
                size360: "https://placehold.co/360x540.png",
                size480: "https://placehold.co/480x720.png",
            },
            youtubeLinks,
            shortDescription: data.shortDescription || data.summary || '',
            longDescription: data.longDescription || '',
            createdAt: data.createdAt || new Date(data.publicationDate).getTime() // Fallback to publication date for old data
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
    let docToProcess: any = null;

    const q = query(booksRef, where("id", "==", id), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      docToProcess = querySnapshot.docs[0];
    } else {
        const bookDocRef = doc(db, 'books', id);
        const bookDoc = await getDoc(bookDocRef);
        if (bookDoc.exists()) {
            docToProcess = bookDoc;
        } else {
            return null;
        }
    }
    
    const data = docToProcess.data();

    // Backward compatibility for old youtubeLink structure
    const youtubeLinks = (data.youtubeLinks || (data.youtubeLink || [])).map((link: string | YoutubeLink) => {
        if (typeof link === 'string') {
            return { url: link, chapters: '' };
        }
        return link;
    });

    return {
        ...data,
        id: data.id || docToProcess.id,
        docId: docToProcess.id,
        coverImages: data.coverImages || {
          size250: "https://placehold.co/250x375.png",
          size360: "https://placehold.co/360x540.png",
          size480: "https://placehold.co/480x720.png",
        },
        youtubeLinks,
        shortDescription: data.shortDescription || data.summary || '',
        longDescription: data.longDescription || '',
        createdAt: data.createdAt || new Date(data.publicationDate).getTime()
    } as Book;

  } catch (error) {
    console.error(`Error fetching book by id ${id}:`, error);
    return null;
  }
}

const BOOKS_PER_PAGE = 10;

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
