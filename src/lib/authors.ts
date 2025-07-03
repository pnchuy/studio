import type { Author } from '@/types';
import authorsData from '@/data/authors.json';

export async function getAllAuthors(): Promise<Author[]> {
  // We keep the async signature to avoid changing all call sites.
  return Promise.resolve(authorsData as Author[]);
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const authors = authorsData as Author[];
  const author = authors.find((author) => author.id === id) || null;
  return Promise.resolve(author);
}
