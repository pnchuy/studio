import { getAllBooks } from '@/lib/books';
import BookList from '@/components/books/BookList';

export default async function Home() {
  const books = await getAllBooks();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
        <p className="text-muted-foreground mt-2">
        Search, sort, and find your next favorite book.
      </p>
      <BookList books={books} />
    </div>
  );
}
