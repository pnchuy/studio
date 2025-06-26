import { getAllBooks } from '@/lib/books';
import BookList from '@/components/books/BookList';
import BookRecommender from '@/components/books/BookRecommender';
import { Separator } from '@/components/ui/separator';

export default async function Home() {
  const books = await getAllBooks();

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Recommendations</h1>
        <p className="text-muted-foreground mt-2">
          Discover new books based on your interests.
        </p>
        <BookRecommender allBooks={books} />
      </div>
      <Separator />
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
         <p className="text-muted-foreground mt-2">
          Search, sort, and find your next favorite book.
        </p>
        <BookList books={books} />
      </div>
    </div>
  );
}
