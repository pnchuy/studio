import { getAllBooks } from '@/lib/books';
import { getAllAuthors } from '@/lib/authors';
import { getAllGenres } from '@/lib/genres';
import type { BookWithDetails } from '@/types';
import BookList from '@/components/books/BookList';

export default async function Home() {
  const allBooks = await getAllBooks();
  const allAuthors = await getAllAuthors();
  const allGenres = await getAllGenres();

  const booksWithDetails: BookWithDetails[] = allBooks.map(book => {
    const author = allAuthors.find(a => a.id === book.authorId);
    const genres = allGenres.filter(g => book.genreIds.includes(g.id));
    return {
      ...book,
      author,
      genres,
    };
  });


  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Explore Our Collection</h1>
        <p className="text-muted-foreground mt-2">
        Search, sort, and find your next favorite book.
      </p>
      <BookList books={booksWithDetails} />
    </div>
  );
}
