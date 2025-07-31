
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import type { BookWithDetails } from '@/types';
import { BookCard } from './BookCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { useResponsivePaging } from '@/hooks/use-responsive-paging';
import { useResponsiveInitialLoad } from '@/hooks/use-responsive-initial-load';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';


interface BookListProps {
  books: BookWithDetails[];
  isSearchPage?: boolean;
}

export function BookList({ books, isSearchPage = false }: BookListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = useResponsivePaging();
  const { initialLoadCount, itemsPerRow } = useResponsiveInitialLoad();
  
  const [visibleCount, setVisibleCount] = useState(initialLoadCount);
  const loadMoreRef = useRef(null);

  const filteredBooks = useMemo(() => {
    if (!debouncedSearchTerm) {
      return books;
    }
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (book.author?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [books, debouncedSearchTerm]);
  
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(initialLoadCount);
  }, [debouncedSearchTerm, booksPerPage, initialLoadCount]);
  
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const currentVisibleBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + visibleCount);
  }, [filteredBooks, currentPage, booksPerPage, visibleCount]);
  
  const hasMoreToLoadOnPage = visibleCount < booksPerPage && currentVisibleBooks.length < filteredBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage).length;

  const loadMoreItems = () => {
    if (hasMoreToLoadOnPage) {
      setVisibleCount(prev => Math.min(prev + itemsPerRow, booksPerPage));
    }
  };

  useInfiniteScroll(loadMoreRef, loadMoreItems, hasMoreToLoadOnPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setVisibleCount(initialLoadCount); // Reset visible count for the new page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
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
        </div>
      )}

      {currentVisibleBooks.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {currentVisibleBooks.map((book) => (
              <BookCard key={`${book.id}-${book.docId}`} book={book} />
            ))}
          </div>

          <div ref={loadMoreRef} />

           {totalPages > 1 && !hasMoreToLoadOnPage && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
              >
                Trang trước
              </Button>
              <span className="text-sm font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
            <p className="text-lg font-medium">No books found.</p>
            <p className="text-muted-foreground">Try adjusting your search parameters.</p>
        </div>
      )}
    </div>
  );
}
