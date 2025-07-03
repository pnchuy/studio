import type { Book } from '@/types';
import booksData from '@/data/books.json';

export async function getAllBooks(): Promise<Book[]> {
  // We keep the async signature to avoid changing all call sites.
  return Promise.resolve(booksData as Book[]);
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = booksData as Book[];
  const book = books.find((book) => book.id === id) || null;
  return Promise.resolve(book);
}
