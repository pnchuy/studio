
import { getPaginatedBooksWithDetails } from '@/lib/books';
import { BookList } from '@/components/books/BookList';
import { TopDiscussedBooks } from '@/components/books/TopDiscussedBooks';

export default async function Home() {
  // Fetch all books by setting a high limit. This is simpler than creating a new function.
  const allBooksResult = await getPaginatedBooksWithDetails({ limit: 1000 });
  const allBooks = allBooksResult.books;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
      <p className="text-muted-foreground mt-2">
        Find your next favorite book.
      </p>
      
      <TopDiscussedBooks allBooks={allBooks} />

      <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Recently Added Books</h2>
      <BookList 
        initialBooks={allBooks}
        initialHasMore={false} // Since we've loaded all books, there are no more to load.
      />
    </div>
  );
}
