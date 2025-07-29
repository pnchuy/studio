
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { Book, YoutubeLink } from '@/types';
import { useLibrary } from '@/hooks/use-library';
import { useSearchHistory } from '@/hooks/use-search-history';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck, ShoppingCart, Headphones, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { convertYoutubeUrlToEmbed } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface BookDetailClientProps {
    book: Book;
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
    const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
    const { addViewedBook } = useSearchHistory();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedYoutubeLink, setSelectedYoutubeLink] = useState<YoutubeLink | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [chapters, setChapters] = useState<number[]>([]);

    useEffect(() => {
        addViewedBook(book.title);
    }, [book.title, addViewedBook]);

    const hasYoutubeLinks = book.youtubeLinks && book.youtubeLinks.length > 0 && book.youtubeLinks.some(link => link.url.trim() !== '');
    const isBookInLibrary = isInLibrary(book.id);

    const chapterNumberingOffset = useMemo(() => {
        if (!selectedYoutubeLink || !hasYoutubeLinks) return 0;

        let offset = 0;
        for (const link of book.youtubeLinks) {
            if (link.url === selectedYoutubeLink.url) {
                break;
            }
            if (link.chapters) {
                offset += link.chapters.split('|').filter(t => t.trim() !== '').length;
            }
        }
        return offset;
    }, [selectedYoutubeLink, book.youtubeLinks, hasYoutubeLinks]);


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

    const handleOpenChange = (isOpen: boolean) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
            // Stop video by removing src
            if (iframeRef.current) {
                iframeRef.current.src = '';
            }
            setSelectedYoutubeLink(null); 
            setChapters([]);
        } else {
             const firstLink = hasYoutubeLinks ? book.youtubeLinks[0] : null;
             handleYoutubeLinkSelect(firstLink);
        }
    }
    
    const handleYoutubeLinkSelect = (link: YoutubeLink | null) => {
        if (!link) return;
        setSelectedYoutubeLink(link);
        if (link.chapters) {
            const chapterTimes = link.chapters.split('|').map(Number).filter(t => !isNaN(t));
            setChapters(chapterTimes);
        } else {
            setChapters([]);
        }
    };
    
    const seekTo = (seconds: number) => {
        if (iframeRef.current) {
            const currentSrc = iframeRef.current.src;
            // Ensure we are working with an actual URL
            if (!currentSrc.startsWith('http')) return;
            const url = new URL(currentSrc);
            url.searchParams.set('start', seconds.toString());
            // Force re-render of iframe to apply new start time
            iframeRef.current.src = url.toString();
        }
    };

    const hasContentForModal = hasYoutubeLinks || book.longDescription;
    
    const sanitizedDescription = useMemo(() => {
        if (typeof window === 'undefined') return book.longDescription;
        return DOMPurify.sanitize(book.longDescription);
    }, [book.longDescription]);


    return (
        <div className="mt-8 border-t pt-8 flex flex-wrap items-center gap-4">
            <Button onClick={handleToggleLibrary} size="lg" className="flex-grow sm:flex-grow-0">
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

             <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button size="lg" disabled={!hasContentForModal} className="flex-grow sm:flex-grow-0 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Headphones className="mr-2 h-5 w-5" />
                        Listen and Read
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>{book.title}</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue={hasYoutubeLinks ? "listen" : "read"} className="w-full mt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="listen" disabled={!hasYoutubeLinks}>Listen</TabsTrigger>
                            <TabsTrigger value="read" disabled={!book.longDescription}>Read</TabsTrigger>
                        </TabsList>

                        <TabsContent forceMount value="listen" className="mt-4 data-[state=inactive]:hidden">
                             {hasYoutubeLinks ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {book.youtubeLinks.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={selectedYoutubeLink?.url === link.url ? "default" : "outline"}
                                                onClick={() => handleYoutubeLinkSelect(link)}
                                            >
                                                Video {index + 1}
                                            </Button>
                                        ))}
                                        {chapters.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" className="flex items-center gap-2">
                                                        <span>Select Chapter</span>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <ScrollArea className="h-48">
                                                        {chapters.map((time, index) => (
                                                            <DropdownMenuItem key={index} onSelect={() => seekTo(time)} className="cursor-pointer">
                                                                Chapter {chapterNumberingOffset + index + 1}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </ScrollArea>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <div className="aspect-video w-full">
                                        <iframe
                                            ref={iframeRef}
                                            key={selectedYoutubeLink?.url} // Change key to force re-render
                                            className="w-full h-full rounded-lg"
                                            src={selectedYoutubeLink ? `${convertYoutubeUrlToEmbed(selectedYoutubeLink.url)}?enablejsapi=1` : ''}
                                            title={`YouTube video player for ${book.title}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                             ) : (
                                <div className="flex items-center justify-center h-[50px] text-muted-foreground text-center">
                                    <p>No audio/video content available for this book.</p>
                                </div>
                             )}
                        </TabsContent>

                        <TabsContent forceMount value="read" className="data-[state=inactive]:hidden">
                             <ScrollArea className="h-[400px] w-full py-4">
                                {book.longDescription ? (
                                    <div 
                                        className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <p>No summary available for this book.</p>
                                    </div>
                                )}
                             </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {book.amazonLink && (
                 <Button asChild size="lg" variant="outline" className="flex-grow sm:flex-grow-0">
                    <Link href={book.amazonLink} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy on Amazon
                    </Link>
                </Button>
            )}
        </div>
    );

    
}
    

    
