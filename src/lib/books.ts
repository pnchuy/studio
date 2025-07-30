
import type { Book, BookWithDetails, YoutubeLink } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit as firestoreLimit, startAfter, where, limit } from 'firebase/firestore';
import { getAllAuthors } from './authors';
import { getAllGenres } from './genres';

// This function is being removed because it's inefficient and was the source of the bug.
// We will now query Firestore directly with pagination.
// export async function getAllBooks(): Promise<Book[]> { ... }

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
  let q = query(booksRef, orderBy("createdAt", "desc"), firestoreLimit(queryLimit));

  if (lastBookId) {
    try {
        const lastVisibleDoc = await getDoc(doc(db, "books", lastBookId));
        if (lastVisibleDoc.exists()) {
            q = query(booksRef, orderBy("createdAt", "desc"), startAfter(lastVisibleDoc), firestoreLimit(queryLimit));
        }
    } catch(e) {
        console.error("Error fetching last visible document:", e);
    }
  }

  const documentSnapshots = await getDocs(q);
  
  const books: BookWithDetails[] = documentSnapshots.docs.map(docSnap => {
    const bookData = docSnap.data();
    const author = allAuthors.find(a => a.id === bookData.authorId);
    const genres = allGenres.filter(g => bookData.genreIds && bookData.genreIds.includes(g.id));
    
    const youtubeLinks = (bookData.youtubeLinks || (bookData.youtubeLink || [])).map((link: string | YoutubeLink) => {
        if (typeof link === 'string') {
          return { url: link, chapters: '' };
        }
        return link;
      });

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

  const hasMore = documentSnapshots.docs.length === queryLimit;
  
  return {
    books,
    hasMore,
  };
}
