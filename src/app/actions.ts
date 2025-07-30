'use server';

import { getPaginatedBooksWithDetails } from '@/lib/books';

export async function fetchMoreBooks(page: number, lastBookId: string | null) {
  const { books, hasMore } = await getPaginatedBooksWithDetails({ page, limit: 20, lastBookId });
  return { books, hasMore };
}
