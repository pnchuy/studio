
import { getAllBooks, getBooksBySeriesName } from '@/lib/books';
import { BookCard } from '@/components/books/BookCard';
import { notFound } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { getAllSeries } from '@/lib/series';
import type { Series, BookWithDetails } from '@/types';
import { getAllAuthors } from '@/lib/authors';
import { getAllGenres } from '@/lib/genres';

type SeriesPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const allSeries = await getAllSeries();
  return allSeries.map(series => ({
    slug: slugify(series.name),
  }));
}

export async function generateMetadata({ params: { slug } }: SeriesPageProps) {
  const allSeries = await getAllSeries();
  const series = allSeries.find(s => slugify(s.name) === slug);
  
  if (!series) {
    return {
      title: 'Series Not Found'
    }
  }

  return {
    title: `"${series.name}" Series | Bibliophile`,
    description: `Browse all books in the ${series.name} series.`,
  }
}

async function getSeriesBooks(seriesName: string): Promise<BookWithDetails[]> {
  const allBooks = await getAllBooks();
  const allAuthors = await getAllAuthors();
  const allGenres = await getAllGenres();

  const seriesBooks = allBooks
    .filter(book => book.series === seriesName)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

  return seriesBooks.map(book => {
    const author = allAuthors.find(a => a.id === book.authorId);
    const genres = allGenres.filter(g => book.genreIds && book.genreIds.includes(g.id));
    return {
      ...book,
      author,
      genres,
    };
  });
}

export default async function SeriesPage({ params: { slug } }: SeriesPageProps) {
  const allSeries = await getAllSeries();
  const series = allSeries.find(s => slugify(s.name) === slug);

  if (!series) {
    notFound();
  }

  const booksInSeries = await getSeriesBooks(series.name);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Series: {series.name}</h1>
      <p className="text-muted-foreground mt-2">
        {booksInSeries.length} book(s) in this series.
      </p>
      
      {booksInSeries.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {booksInSeries.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No books found for this series.</p>
        </div>
      )}
    </div>
  );
}
