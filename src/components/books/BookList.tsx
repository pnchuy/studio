"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Book } from '@/types';
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

interface BookListProps {
  books: Book[];
}

export default function BookList({ books }: BookListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('title_asc');
  const { addSearchTerm } = useSearchHistory();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      addSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, addSearchTerm]);

  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'author_asc':
          return a.author.localeCompare(b.author);
        case 'author_desc':
          return b.author.localeCompare(a.author);
        case 'date_newest':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'date_oldest':
          return new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime();
        default:
          return 0;
      }
    });
  }, [books, searchTerm, sortOrder]);

  return (
    <div className="mt-8 space-y-8">
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

      {filteredAndSortedBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredAndSortedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
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
