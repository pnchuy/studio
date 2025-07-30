
import type { Book, BookWithDetails, YoutubeLink } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit as firestoreLimit, startAfter, where } from 'firebase/firestore';
import { getAllAuthors } from './authors';
import { getAllGenres } from './genres';


/**
 * Fetches all books from the Firestore database and enriches them with author and genre details.
 *
 * @returns A promise that resolves to an array of all books with their full details.
 */
export async function getAllBooks(): Promise<BookWithDetails[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  
  const [allAuthors, allGenres] = await Promise.all([
    getAllAuthors(),
    getAllGenres(),
  ]);

  const booksRef = collection(db, "books");
  // No orderBy here to get ALL documents regardless of createdAt field existence
  const documentSnapshots = await getDocs(booksRef);
  
  const books: BookWithDetails[] = documentSnapshots.docs.map(docSnap => {
    const bookData = docSnap.data();
    const author = allAuthors.find(a => a.id === bookData.authorId);
    const genres = allGenres.filter(g => bookData.genreIds && bookData.genreIds.includes(g.id));
    
    const youtubeLinks = (bookData.youtubeLinks || []).map((link: string | YoutubeLink) => 
      typeof link === 'string' ? { url: link, chapters: '' } : link
    );

    return {
      ...bookData,
      id: bookData.id || docSnap.id,
      docId: docSnap.id,
      author: author,
      genres,
      coverImages: {
        size250: bookData.coverImages?.size250?.trim() || "https://placehold.co/250x375.png",
        size360: bookData.coverImages?.size360?.trim() || "https://placehold.co/360x540.png",
        size480: bookData.coverImages?.size480?.trim() || "https://placehold.co/480x720.png",
      },
      youtubeLinks,
      shortDescription: bookData.shortDescription || bookData.summary || '',
      longDescription: bookData.longDescription || '',
      createdAt: bookData.createdAt || new Date(bookData.publicationDate).getTime()
    } as BookWithDetails;
  });

  // Sort on the client-side after fetching all books
  return books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}


export async function getBookById(id: string): Promise<Book | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const booksRef = collection(db, 'books');
    let docToProcess: any = null;

    const q = query(booksRef, where("id", "==", id), firestoreLimit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      docToProcess = querySnapshot.docs[0];
    } else {
        try {
            const bookDocRef = doc(db, 'books', id);
            const bookDoc = await getDoc(bookDocRef);
            if (bookDoc.exists()) {
                docToProcess = bookDoc;
            } else {
                return null;
            }
        } catch (e) {
             return null;
        }
    }
    
    if (!docToProcess) return null;

    const data = docToProcess.data();

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
        coverImages: {
            size250: data.coverImages?.size250?.trim() || "https://placehold.co/250x375.png",
            size360: data.coverImages?.size360?.trim() || "https://placehold.co/360x540.png",
            size480: data.coverImages?.size480?.trim() || "https://placehold.co/480x720.png",
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

export async function getPaginatedBooksWithDetails({ limit: queryLimit = 10, lastBookId }: { limit?: number, lastBookId?: string | null }) {
  if (!isFirebaseConfigured || !db) {
    return { books: [], hasMore: false };
  }
  
  const [allAuthors, allGenres] = await Promise.all([
    getAllAuthors(),
    getAllGenres(),
  ]);

  const booksRef = collection(db, "books");
  
  // A robust query that doesn't rely on `createdAt` for filtering, only for sorting.
  const q = query(booksRef, orderBy("publicationDate", "desc"), firestoreLimit(queryLimit * 5)); // Fetch more to sort in memory
  
  const documentSnapshots = await getDocs(q);
  
  let books: BookWithDetails[] = documentSnapshots.docs.map(docSnap => {
    const bookData = docSnap.data();
    const author = allAuthors.find(a => a.id === bookData.authorId);
    const genres = allGenres.filter(g => bookData.genreIds && bookData.genreIds.includes(g.id));
    
    const youtubeLinks = (bookData.youtubeLinks || []).map((link: string | YoutubeLink) => 
      typeof link === 'string' ? { url: link, chapters: '' } : link
    );

    return {
      ...bookData,
      id: bookData.id || docSnap.id,
      docId: docSnap.id,
      author: author,
      genres,
      coverImages: {
        size250: bookData.coverImages?.size250?.trim() || "https://placehold.co/250x375.png",
        size360: bookData.coverImages?.size360?.trim() || "https://placehold.co/360x540.png",
        size480: bookData.coverImages?.size480?.trim() || "https://placehold.co/480x720.png",
      },
      youtubeLinks,
      shortDescription: bookData.shortDescription || bookData.summary || '',
      longDescription: bookData.longDescription || '',
      createdAt: bookData.createdAt || new Date(bookData.publicationDate).getTime()
    } as BookWithDetails;
  });

  // Sort client-side to handle documents that might be missing the 'createdAt' field
  books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Now apply pagination logic on the full sorted list
  let paginatedBooks = books;
  if(lastBookId){
    const lastBookIndex = books.findIndex(b => b.docId === lastBookId);
    if(lastBookIndex !== -1){
        paginatedBooks = books.slice(lastBookIndex + 1);
    }
  }

  const hasMore = paginatedBooks.length > queryLimit;
  paginatedBooks = paginatedBooks.slice(0, queryLimit);
  
  return {
    books: paginatedBooks,
    hasMore,
  };
}
