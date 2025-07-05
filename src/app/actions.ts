'use server';

import { getPaginatedBooksWithDetails } from '@/lib/books';

export async function fetchMoreBooks(page: number) {
  // You can add more parameters here like searchTerm, sortOrder for server-side filtering
  const { books, hasMore } = await getPaginatedBooksWithDetails({ page });
  return { books, hasMore };
}
