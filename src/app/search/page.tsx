
import { getAllBooks } from '@/lib/books';
import { BookList } from '@/components/books/BookList';

export default async function SearchPage() {
  const initialBooks = await getAllBooks();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Search Results</h1>
      <p className="text-muted-foreground mt-2">
        Find any book in our collection by title or author.
      </p>
      <BookList 
        initialBooks={initialBooks}
        isSearchPage={true}
      />
    </div>
  );
}
