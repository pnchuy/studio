"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLibrary } from '@/hooks/use-library';
import type { Book } from '@/types';
import { getAllBooks } from '@/lib/books';
import { BookCard } from '@/components/books/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LibraryPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { library, isLoading: libraryLoading } = useLibrary();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    async function fetchBooks() {
      // This is a client-side fetch, which is not ideal for production
      // but works for this simulation. A real app would use an API route.
      try {
        const books = await getAllBooks();
        setAllBooks(books);
      } catch (error) {
        console.error("Failed to fetch books on client", error);
      } finally {
        setDataLoading(false);
      }
    }
    fetchBooks();
  }, []);

  const libraryBooks = allBooks.filter(book => library.includes(book.id));
  const isLoading = authLoading || libraryLoading || dataLoading;

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="space-y-2">
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // or a login prompt
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Library</h1>
      <p className="text-muted-foreground mt-2">
        Your curated collection of books.
      </p>

      {libraryBooks.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {libraryBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg py-12">
            <h2 className="text-xl font-semibold font-headline">Your library is empty.</h2>
            <p className="mt-2 text-muted-foreground">
                Add books to your library to see them here.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Explore Books</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
