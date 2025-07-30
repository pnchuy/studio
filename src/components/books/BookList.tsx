
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { useSearchParams } from 'next/navigation';

interface BookListProps {
  books: BookWithDetails[];
  isSearchPage?: boolean;
}

export function BookList({ books, isSearchPage = false }: BookListProps) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const { addSearchTerm } = useSearchHistory();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (queryFromUrl) {
      setSearchTerm(queryFromUrl);
    }
  }, [queryFromUrl]);

  const filteredBooks = useMemo(() => {
    if (isSearchPage && debouncedSearchTerm) {
        return books.filter(
            (book) =>
                book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (book.author?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }
    return books;
  }, [books, isSearchPage, debouncedSearchTerm]);


  useEffect(() => {
    if (debouncedSearchTerm && isSearchPage) {
      addSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, addSearchTerm, isSearchPage]);

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

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredBooks.map((book) => (
            <BookCard key={`${book.id}-${book.docId}`} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-lg font-medium">No books found.</p>
            <p className="text-muted-foreground">Try adjusting your search or sort parameters.</p>
        </div>
      )}
    </div>
  );
}
