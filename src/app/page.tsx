import { getPaginatedBooksWithDetails } from '@/lib/books';
import { BookList } from '@/components/books/BookList';
import { getAllBooks } from '@/lib/books';
import BookRecommender from '@/components/books/BookRecommender';

export default async function Home() {
  const [{ books: initialBooks, hasMore: initialHasMore }, allBooks] = await Promise.all([
    getPaginatedBooksWithDetails({ page: 1 }),
    getPaginatedBooksWithDetails({ limit: 1000 }).then(res => res.books) // Fetch more for recommender
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
      <p className="text-muted-foreground mt-2">
        Find your next favorite book.
      </p>
      <BookRecommender allBooks={allBooks} />
      <BookList 
        initialBooks={initialBooks}
        initialHasMore={initialHasMore}
      />
    </div>
  );
}
