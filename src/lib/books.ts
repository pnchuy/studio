
import type { Book, BookWithDetails, YoutubeLink } from '@/types';
import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, getDoc, query, orderBy, limit as firestoreLimit, startAfter, documentId, where, limit } from 'firebase/firestore';
import { getAllAuthors } from './authors';
import { getAllGenres } from './genres';

export async function getAllBooks(): Promise<Book[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const booksCol = collection(db, 'books');
    const q = query(booksCol, orderBy("createdAt", "desc"));
    const bookSnapshot = await getDocs(q);
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
            id: data.id || doc.id, // Use Firestore doc ID as fallback for id
            docId: doc.id,
            coverImages: {
                size250: data.coverImages?.size250?.trim() || "https://placehold.co/250x375.png",
                size360: data.coverImages?.size360?.trim() || "https://placehold.co/360x540.png",
                size480: data.coverImages?.size480?.trim() || "https://placehold.co/480x720.png",
            },
            youtubeLinks,
            shortDescription: data.shortDescription || data.summary || '',
            longDescription: data.longDescription || '',
            createdAt: data.createdAt || new Date(data.publicationDate).getTime() // Fallback to publication date for old data
        } as Book;
    }).filter(book => book.id && book.title); // Ensure book has an id and a title
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

export async function getPaginatedBooksWithDetails({ page = 1, limit: queryLimit = 10, lastBookId }: { page?: number; limit?: number, lastBookId?: string | null }) {
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
    const lastVisibleDoc = await getDoc(doc(db, "books", lastBookId));
    if(lastVisibleDoc.exists()){
        q = query(booksRef, orderBy("createdAt", "desc"), startAfter(lastVisibleDoc), firestoreLimit(queryLimit));
    }
  }

  const documentSnapshots = await getDocs(q);
  
  const books: BookWithDetails[] = documentSnapshots.docs.map(docSnap => {
    const bookData = docSnap.data();
    const author = allAuthors.find(a => a.id === bookData.authorId);
    const genres = allGenres.filter(g => bookData.genreIds && bookData.genreIds.includes(g.id));
    
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
      }
    } as BookWithDetails;
  });

  const hasMore = books.length === queryLimit;
  
  return {
    books,
    hasMore,
  };
}
