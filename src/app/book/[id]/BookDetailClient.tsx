
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { Book, YoutubeLink } from '@/types';
import { useLibrary } from '@/hooks/use-library';
import { useSearchHistory } from '@/hooks/use-search-history';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck, ShoppingCart, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
            const url = new URL(currentSrc);
            url.searchParams.set('start', seconds.toString());
            // Force re-render of iframe to apply new start time
            iframeRef.current.src = url.toString();
        }
    };

    const hasContentForModal = hasYoutubeLinks || book.shortDescription || book.longDescription;
    const combinedDescription = book.longDescription || book.shortDescription;
    const sanitizedDescription = DOMPurify.sanitize(combinedDescription);


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
                            <TabsTrigger value="read" disabled={!book.shortDescription && !book.longDescription}>Read</TabsTrigger>
                        </TabsList>
                        <TabsContent value="listen">
                            <div className="py-4 space-y-4 min-h-[300px]">
                                {hasYoutubeLinks ? (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            {book.youtubeLinks.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={selectedYoutubeLink?.url === link.url ? "default" : "outline"}
                                                    onClick={() => handleYoutubeLinkSelect(link)}
                                                >
                                                    Video {index + 1}
                                                </Button>
                                            ))}
                                        </div>
                                        {chapters.length > 0 && (
                                            <div className="flex flex-wrap gap-2 border-t pt-4 mt-4">
                                                {chapters.map((time, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="secondary"
                                                        onClick={() => seekTo(time)}
                                                    >
                                                        Part {chapterNumberingOffset + index + 1}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                        {selectedYoutubeLink && (
                                            <div className="aspect-video w-full mt-4">
                                                <iframe
                                                    ref={iframeRef}
                                                    key={selectedYoutubeLink.url} // Change key to force re-render
                                                    className="w-full h-full rounded-lg"
                                                    src={`${convertYoutubeUrlToEmbed(selectedYoutubeLink.url)}?enablejsapi=1`}
                                                    title={`YouTube video player for ${book.title}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <p>No audio/video content available for this book.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="read">
                             <ScrollArea className="h-[400px] w-full py-4">
                                {combinedDescription ? (
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
