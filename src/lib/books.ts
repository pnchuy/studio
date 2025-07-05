import type { Book, BookWithDetails } from '@/types';
import booksData from '@/data/books.json';
import { getAllAuthors } from './authors';
import { getAllGenres } from './genres';

export async function getAllBooks(): Promise<Book[]> {
  // We keep the async signature to avoid changing all call sites.
  return Promise.resolve(booksData as Book[]);
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = booksData as Book[];
  const book = books.find((book) => book.id === id) || null;
  return Promise.resolve(book);
}

const BOOKS_PER_PAGE = 10;

export async function getPaginatedBooksWithDetails({ page = 1, limit = BOOKS_PER_PAGE }: { page?: number; limit?: number }) {
  const allBooks: Book[] = booksData;
  const allAuthors = await getAllAuthors();
  const allGenres = await getAllGenres();
  
  const totalBooks = allBooks.length;
  const totalPages = Math.ceil(totalBooks / limit);
  const offset = (page - 1) * limit;

  const paginatedBooks = allBooks.slice(offset, offset + limit);

  const booksWithDetails: BookWithDetails[] = paginatedBooks.map(book => {
    const author = allAuthors.find(a => a.id === book.authorId);
    const genres = allGenres.filter(g => book.genreIds.includes(g.id));
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
