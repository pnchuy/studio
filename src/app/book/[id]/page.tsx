
import { getBookById } from '@/lib/books';
import { getAuthorById } from '@/lib/authors';
import { getGenresByIds } from '@/lib/genres';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar, Book as BookIcon, Hash, User as UserIcon } from 'lucide-react';
import BookDetailClient from './BookDetailClient';
import { CommentSection } from '@/components/comments/CommentSection';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { slugify } from '@/lib/utils';

type BookPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params: { id } }: BookPageProps) {
    const bookId = id.split('-')[0];
    const book = await getBookById(bookId);
    
    if (!book) {
        return {
            title: 'Book Not Found'
        }
    }
    const author = await getAuthorById(book.authorId);
    return {
        title: `${book.title} by ${author?.name || 'Unknown'} | Bibliophile`,
        description: book.shortDescription,
    }
}

async function getSanitizedDescription(description: string | undefined) {
    if (typeof window !== 'undefined' || !description) {
        return description || '';
    }
    const { JSDOM } = await import('jsdom');
    const DOMPurify = (await import('dompurify')).default;
    const domWindow = new JSDOM('').window;
    const purify = DOMPurify(domWindow as unknown as Window);
    return purify.sanitize(description);
}


export default async function BookPage({ params: { id } }: BookPageProps) {
  const bookId = id.split('-')[0];
  const book = await getBookById(bookId);

  if (!book) {
    notFound();
  }

  const author = await getAuthorById(book.authorId);
  const genres = await getGenresByIds(book.genreIds);
  
  const sanitizedLongDescription = await getSanitizedDescription(book.longDescription);

  return (
    <article>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-1">
                <div className="relative aspect-[2/3] w-full max-w-sm mx-auto shadow-xl rounded-lg overflow-hidden">
                    <Image
                    src={book.coverImages.size480}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover"
                    data-ai-hint="book cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                    />
                </div>
            </div>

            <div className="md:col-span-2">
                <h1 className="text-4xl font-bold font-headline leading-tight">{book.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                    {author ? (
                        <Link href={`/author/${author.id}`} className="text-xl text-muted-foreground hover:text-primary hover:underline">
                            {author.name}
                        </Link>
                    ) : (
                        <p className="text-xl text-muted-foreground">Unknown Author</p>
                    )}
                </div>
                
                <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <span>Published on {new Date(book.publicationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {book.series && (
                         <div className="flex items-center gap-3">
                            <BookIcon className="w-5 h-5 text-muted-foreground" />
                            <span>From{' '}
                                <Link href={`/series/${slugify(book.series)}`} className="font-semibold text-primary hover:underline">
                                    {book.series}
                                </Link>
                                {' '}{book.seriesOrder !== null ? `#${book.seriesOrder}` : ''}
                            </span>
                        </div>
                    )}
                     <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-muted-foreground mt-1" />
                        <div className="flex flex-wrap gap-2">
                         {genres.map(genre => <Badge key={genre.id}>{genre.name}</Badge>)}
                        </div>
                    </div>
                </div>

                <BookDetailClient book={book} />
            </div>
        </div>

        {sanitizedLongDescription && (
            <Card className="mt-12">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">Mô tả chi tiết</CardTitle>
                </CardHeader>
                <CardContent>
                    <div 
                        className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizedLongDescription }}
                    />
                </CardContent>
            </Card>
        )}
        
        <CommentSection bookId={book.id} />
    </article>
  );
}
