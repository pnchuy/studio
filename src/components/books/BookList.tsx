"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { BookWithDetails } from '@/types';
import { BookCard } from './BookCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useDebounce } from '@/hooks/use-debounce';
import { useResponsiveColumns } from '@/hooks/use-responsive-columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { fetchMoreBooks } from '@/app/actions';

interface BookListProps {
  initialBooks: BookWithDetails[];
  initialHasMore: boolean;
}

export function BookList({ initialBooks, initialHasMore }: BookListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('title_asc');
  const { addSearchTerm } = useSearchHistory();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // State for infinite scroll
  const [books, setBooks] = useState<BookWithDetails[]>(initialBooks);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const columns = useResponsiveColumns();

  // Reset list when filters change
  useEffect(() => {
    // This effect should only run for client-side filtering after initial load.
    // The initial data is already provided.
    // For a full implementation, filtering would also be a server action.
    setBooks(initialBooks);
    setPage(2);
    setHasMore(initialHasMore);
  }, [searchTerm, sortOrder, initialBooks, initialHasMore]);


  const filteredAndSortedBooks = useMemo(() => {
    // Note: This filtering is client-side. For large datasets, this should be moved to the server action.
    let filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (book.author?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'author_asc':
          return (a.author?.name || '').localeCompare(b.author?.name || '');
        case 'author_desc':
          return (b.author?.name || '').localeCompare(a.author?.name || '');
        case 'date_newest':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'date_oldest':
          return new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime();
        default:
          return 0;
      }
    });
  }, [books, debouncedSearchTerm, sortOrder]);


  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore || debouncedSearchTerm) return; // Don't load more if searching client-side

    setIsLoadingMore(true);
    const { books: newBooks, hasMore: newHasMore } = await fetchMoreBooks(page);
    setBooks((prevBooks) => [...prevBooks, ...newBooks]);
    setHasMore(newHasMore);
    setPage((prevPage) => prevPage + 1);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, page, debouncedSearchTerm]);


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        const [target] = entries;
        if (target.isIntersecting) {
            loadMoreItems();
        }
    }, {
        rootMargin: '400px',
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
        observer.observe(currentRef);
    }

    return () => {
        if (currentRef) {
            observer.unobserve(currentRef);
        }
    };
  }, [loadMoreItems]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      addSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, addSearchTerm]);

  return (
    <div className="mt-8 space-y-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                <SelectItem value="author_asc">Author (A-Z)</SelectItem>
                <SelectItem value="author_desc">Author (Z-A)</SelectItem>
                <SelectItem value="date_newest">Publication Date (Newest)</SelectItem>
                <SelectItem value="date_oldest">Publication Date (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedBooks.length > 0 ? (
        <>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredAndSortedBooks.map((book) => (
            <BookCard key={`${book.id}-${sortOrder}`} book={book} />
          ))}
        </div>
         {(hasMore || isLoadingMore) && !debouncedSearchTerm && (
            <div ref={loadMoreRef} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 h-20">
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="space-y-2">
                   <Skeleton className="aspect-[2/3] w-full" />
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
               </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
            <p className="text-lg font-medium">No books found.</p>
            <p className="text-muted-foreground">Try adjusting your search or sort parameters.</p>
        </div>
      )}
    </div>
  );
}
