"use client";

import { useEffect } from 'react';
import type { Book } from '@/types';
import { useLibrary } from '@/hooks/use-library';
import { useSearchHistory } from '@/hooks/use-search-history';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookDetailClientProps {
    book: Book;
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
    const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
    const { addViewedBook } = useSearchHistory();
    const { toast } = useToast();

    useEffect(() => {
        addViewedBook(book.title);
    }, [book.title, addViewedBook]);

    const isBookInLibrary = isInLibrary(book.id);

    const handleToggleLibrary = () => {
        if (isBookInLibrary) {
            removeFromLibrary(book.id);
            toast({
                title: "Removed from library",
                description: `"${book.title}" has been removed from your library.`,
            });
        } else {
            addToLibrary(book.id);
            toast({
                title: "Added to library",
                description: `"${book.title}" has been added to your library.`,
            });
        }
    };

    return (
        <div className="mt-8 border-t pt-8">
            <Button onClick={handleToggleLibrary} size="lg" className="w-full md:w-auto">
                {isBookInLibrary ? (
                    <>
                        <BookmarkCheck className="mr-2 h-5 w-5" />
                        In Your Library
                    </>
                ) : (
                    <>
                        <BookmarkPlus className="mr-2 h-5 w-5" />
                        Add to Library
                    </>
                )}
            </Button>
        </div>
    );
}
