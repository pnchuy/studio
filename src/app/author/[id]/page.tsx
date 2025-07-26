
import { getAllAuthors, getAuthorById } from '@/lib/authors';
import { getAllBooks } from '@/lib/books';
import { BookCard } from '@/components/books/BookCard';
import { notFound } from 'next/navigation';
import type { BookWithDetails, Author } from '@/types';
import { getAllGenres } from '@/lib/genres';

type AuthorPageProps = {
  params: {
    id: string;
  };
};

export async function generateStaticParams() {
  const allAuthors = await getAllAuthors();
  return allAuthors.map(author => ({
    id: author.id,
  }));
}

export async function generateMetadata({ params: { id } }: AuthorPageProps) {
  const author = await getAuthorById(id);
  
  if (!author) {
    return {
      title: 'Author Not Found'
    }
  }

  return {
    title: `Books by ${author.name} | Bibliophile`,
    description: `Browse all books by the author ${author.name}.`,
  }
}

async function getAuthorBooks(authorId: string): Promise<BookWithDetails[]> {
  const allBooks = await getAllBooks();
  const allAuthors = await getAllAuthors();
  const allGenres = await getAllGenres();

  const authorBooks = allBooks.filter(book => book.authorId === authorId);

  return authorBooks.map(book => {
    const author = allAuthors.find(a => a.id === book.authorId);
    const genres = allGenres.filter(g => book.genreIds && book.genreIds.includes(g.id));
    return {
      ...book,
      author,
      genres,
    };
  });
}

export default async function AuthorPage({ params: { id } }: AuthorPageProps) {
  const author = await getAuthorById(id);

  if (!author) {
    notFound();
  }

  const booksByAuthor = await getAuthorBooks(author.id);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Books by {author.name}</h1>
      <p className="text-muted-foreground mt-2">
        {booksByAuthor.length} book(s) found in our collection.
      </p>
      
      {booksByAuthor.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {booksByAuthor.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No books found for this author.</p>
        </div>
      )}
    </div>
  );
}
