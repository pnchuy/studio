
import { getAllBooks } from '@/lib/books';
import { BookList } from '@/components/books/BookList';
import { TopDiscussedBooks } from '@/components/books/TopDiscussedBooks';

export default async function Home() {
  const allBooks = await getAllBooks();

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline">Explore Our Collection</h1>
      <p className="text-muted-foreground mt-2">
        Find your next favorite book.
      </p>
      
      <TopDiscussedBooks allBooks={allBooks} />

      <h2 className="text-2xl font-bold font-headline mt-12 mb-4">All books</h2>
      <BookList 
        books={allBooks}
        isSearchPage={false}
      />
    </div>
  );
}
