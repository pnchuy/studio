"use client";

import { useState, useEffect, useMemo } from 'react';
import type { BookWithDetails, Comment } from '@/types';
import { BookCard } from './BookCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from '../ui/skeleton';

interface TopDiscussedBooksProps {
  allBooks: BookWithDetails[];
}

const COMMENTS_STORAGE_KEY_PREFIX = 'bibliophile-comments-';

export function TopDiscussedBooks({ allBooks }: TopDiscussedBooksProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // This effect runs on the client, so localStorage is available.
    const counts = new Map<string, number>();
    allBooks.forEach(book => {
      try {
        const storedComments = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${book.id}`);
        if (storedComments) {
          const comments: Comment[] = JSON.parse(storedComments);
          counts.set(book.id, comments.length);
        } else {
          counts.set(book.id, 0);
        }
      } catch (error) {
        console.warn(`Could not parse comments for book ${book.id}`, error);
        counts.set(book.id, 0);
      }
    });
    setCommentCounts(counts);
    setIsLoading(false);
  }, [allBooks]);

  const topBooks = useMemo(() => {
    if (isLoading || commentCounts.size === 0) {
      return [];
    }
    
    return [...allBooks]
      .sort((a, b) => (commentCounts.get(b.id) || 0) - (commentCounts.get(a.id) || 0))
      .slice(0, 15)
      .filter(book => (commentCounts.get(book.id) || 0) > 0); // Only show books with comments
  }, [allBooks, commentCounts, isLoading]);

  if (isLoading) {
    return (
       <div className="mt-8">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="flex space-x-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="min-w-0 shrink-0 grow-0 basis-1/2 md:basis-1/3 lg:basis-1/5 space-y-2">
                        <Skeleton className="aspect-[2/3] w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
  }

  if (topBooks.length === 0) {
    return null; // Don't render the section if there are no discussed books
  }

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-2xl font-bold font-headline mb-4">Top Discussed Books</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {topBooks.map((book) => (
            <CarouselItem key={book.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
              <div className="p-1">
                <BookCard book={book} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
}
