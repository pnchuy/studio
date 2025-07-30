
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import type { BookWithDetails } from '@/types';
import { cn, slugify } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { getPaginatedBooksWithDetails } from '@/lib/books';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '../ui/button';

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [data, setData] = useState<BookWithDetails[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((isOpen) => !isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setIsOpen(false);
    command();
  }, []);


  useEffect(() => {
    if (!debouncedQuery) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const { books: allBooks } = await getPaginatedBooksWithDetails({ limit: 1000 });
      
      const filteredData = allBooks.filter(book => 
          book.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
          book.author?.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setData(filteredData);
      setLoading(false);
    };

    fetchData();
  }, [debouncedQuery]);


  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = data?.slice(0, 5) ?? [];
  const hasMoreResults = (data?.length ?? 0) > 5;

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64'
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">Tìm kiếm sách...</span>
        <span className="inline-flex lg:hidden">Tìm kiếm...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
             <div className="p-4 text-sm flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tìm kiếm...
            </div>
          )}
          
          {!loading && !data && <CommandEmpty>Nhập để tìm kiếm sách.</CommandEmpty>}

          {!loading && data?.length === 0 && <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>}

          {searchResults.length > 0 && (
            <CommandGroup heading="Sách">
              {searchResults.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.title}
                  onSelect={() => {
                    runCommand(() => router.push(`/book/${book.id}-${slugify(book.title)}`));
                  }}
                  className="!py-2"
                >
                  <div className="flex items-center gap-3">
                    <Image
                        src={book.coverImages.size250.trim()}
                        alt={`Bìa sách ${book.title}`}
                        width={40}
                        height={60}
                        className="rounded-sm object-cover"
                        data-ai-hint="book cover"
                    />
                    <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author?.name}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

           {hasMoreResults && (
             <CommandItem
                onSelect={() => runCommand(() => router.push(`/search?q=${debouncedQuery}`))}
                className="text-center justify-center"
              >
                <Link href={`/search?q=${debouncedQuery}`} className="text-sm text-primary hover:underline">
                  Xem tất cả {data?.length} kết quả
                </Link>
             </CommandItem>
           )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
