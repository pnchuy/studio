
"use client";

import { useEffect, useState } from 'react';
import { useLibrary } from '@/hooks/use-library';
import type { Book, Author, Genre, BookWithDetails } from '@/types';
import { getAllBooks } from '@/lib/books';
import { getAllAuthors } from '@/lib/authors';
import { getAllGenres } from '@/lib/genres';
import { BookCard } from '@/components/books/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FavoriteBooks() {
  const { library, isLoading: libraryLoading } = useLibrary();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allAuthors, setAllAuthors] = useState<Author[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
       try {
        const [books, authors, genres] = await Promise.all([
            getAllBooks(),
            getAllAuthors(),
            getAllGenres()
        ]);
        setAllBooks(books);
        setAllAuthors(authors);
        setAllGenres(genres);
      } catch (error) {
        console.error("Failed to fetch favorite books data", error);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  const libraryBooks: BookWithDetails[] = allBooks
    .filter(book => library.includes(book.id))
    .map(book => {
        const author = allAuthors.find(a => a.id === book.authorId);
        const genres = allGenres.filter(g => book.genreIds.includes(g.id));
        return {
        ...book,
        author,
        genres,
        };
    });

  const isLoading = libraryLoading || dataLoading;

  if (isLoading) {
    return (
      <div>
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

  return (
    <div>
      {libraryBooks.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {libraryBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg py-12">
            <h2 className="text-xl font-semibold font-headline">Thư viện yêu thích của bạn trống.</h2>
            <p className="mt-2 text-muted-foreground">
                Thêm sách vào thư viện để xem chúng ở đây.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Khám phá sách</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
