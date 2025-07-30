
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
import { Search, Loader2 } from 'lucide-react';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchMoreBooks } from '@/app/actions';
import { useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';

interface BookListProps {
  initialBooks: BookWithDetails[];
  initialHasMore: boolean;
  isSearchPage?: boolean;
}

export function BookList({ initialBooks, initialHasMore, isSearchPage = false }: BookListProps) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [sortOrder, setSortOrder] = useState('title_asc');
  const { addSearchTerm } = useSearchHistory();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // State for infinite scroll
  const [books, setBooks] = useState<BookWithDetails[]>(initialBooks);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (queryFromUrl) {
      setSearchTerm(queryFromUrl);
    }
  }, [queryFromUrl]);

  useEffect(() => {
    setBooks(initialBooks);
    setHasMore(initialHasMore);
    setPage(2);
  }, [initialBooks, initialHasMore]);

  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books;
    if (debouncedSearchTerm) {
        filtered = books.filter(
            (book) =>
                book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (book.author?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }

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
    if (isLoadingMore || !hasMore || debouncedSearchTerm) return;

    setIsLoadingMore(true);
    const lastBookId = books.length > 0 ? books[books.length - 1].docId : null;
    const { books: newBooks, hasMore: newHasMore } = await fetchMoreBooks(page, lastBookId);
    setBooks((prevBooks) => [...prevBooks, ...newBooks]);
    setHasMore(newHasMore);
    setPage((prevPage) => prevPage + 1);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, page, debouncedSearchTerm, books]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      addSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, addSearchTerm]);

  return (
    <div className="mt-8 space-y-8">
      {isSearchPage && (
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
      )}

      {filteredAndSortedBooks.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredAndSortedBooks.map((book) => (
              <BookCard key={`${book.id}-${book.docId}`} book={book} />
            ))}
          </div>
          <div className="flex justify-center">
            {hasMore && !debouncedSearchTerm && (
                <Button onClick={loadMoreItems} disabled={isLoadingMore} variant="outline" size="lg">
                    {isLoadingMore ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang tải...
                        </>
                    ) : (
                        'Tải thêm sách'
                    )}
                </Button>
            )}
            </div>
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
