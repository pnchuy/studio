
import { getPaginatedBooksWithDetails } from '@/lib/books';
import { BookList } from '@/components/books/BookList';

export default async function SearchPage() {
  // The BookList component now contains all the logic for searching and sorting.
  // We can pass the full initial list to it.
  const { books: initialBooks, hasMore: initialHasMore } = await getPaginatedBooksWithDetails({ limit: 50 });

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Search Results</h1>
      <p className="text-muted-foreground mt-2">
        Find any book in our collection by title or author.
      </p>
      <BookList 
        initialBooks={initialBooks}
        initialHasMore={initialHasMore}
        isSearchPage={true}
      />
    </div>
  );
}
