
import { getPaginatedBooksWithDetails } from '@/lib/books';
import { BookList } from '@/components/books/BookList';
import { TopDiscussedBooks } from '@/components/books/TopDiscussedBooks';

export default async function Home() {
  const [{ books: initialBooks, hasMore: initialHasMore }, allBooks] = await Promise.all([
    getPaginatedBooksWithDetails({ page: 1, limit: 10 }),
    getPaginatedBooksWithDetails({ limit: 1000 }).then(res => res.books)
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
      <p className="text-muted-foreground mt-2">
        Find your next favorite book.
      </p>
      
      <TopDiscussedBooks allBooks={allBooks} />

      <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Recently Added Books</h2>
      <BookList 
        initialBooks={initialBooks}
        initialHasMore={initialHasMore}
      />
    </div>
  );
}
