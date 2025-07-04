import { getBookById } from '@/lib/books';
import { getAuthorById } from '@/lib/authors';
import { getGenresByIds } from '@/lib/genres';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar, Book as BookIcon, Hash, User as UserIcon } from 'lucide-react';
import BookDetailClient from './BookDetailClient';
import { CommentSection } from '@/components/comments/CommentSection';

type BookPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: BookPageProps) {
    const book = await getBookById(params.id);
    if (!book) {
        return {
            title: 'Book Not Found'
        }
    }
    const author = await getAuthorById(book.authorId);
    return {
        title: `${book.title} by ${author?.name || 'Unknown'} | Bibliophile`,
        description: book.summary,
    }
}

export default async function BookPage({ params }: BookPageProps) {
  const book = await getBookById(params.id);

  if (!book) {
    notFound();
  }

  const author = await getAuthorById(book.authorId);
  const genres = await getGenresByIds(book.genreIds);

  return (
    <article>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-1">
                <div className="relative aspect-[2/3] w-full max-w-sm mx-auto shadow-xl rounded-lg overflow-hidden">
                    <Image
                    src={book.coverImage}
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
                    <p className="text-xl text-muted-foreground">{author?.name || 'Unknown Author'}</p>
                </div>
                
                <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <span>Published on {new Date(book.publicationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {book.series && (
                         <div className="flex items-center gap-3">
                            <BookIcon className="w-5 h-5 text-muted-foreground" />
                            <span>Part of the <span className="font-semibold">{book.series}</span> series</span>
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

        <div className="mt-12">
            <h2 className="text-2xl font-bold font-headline mb-4">Summary</h2>
            <p className="prose dark:prose-invert max-w-none text-lg leading-relaxed">{book.summary}</p>
        </div>
        
        <CommentSection bookId={book.id} />
    </article>
  );
}
