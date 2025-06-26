"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchHistory } from '@/hooks/use-search-history';
import { recommendBooks, RecommendBooksOutput } from '@/ai/flows/recommend-books';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { BookCard } from './BookCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BookRecommenderProps {
  allBooks: Book[];
}

export default function BookRecommender({ allBooks }: BookRecommenderProps) {
  const [recommendations, setRecommendations] = useState<RecommendBooksOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { history } = useSearchHistory();
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);
    try {
      if (history.previousSearches.length === 0 && history.viewedBooks.length === 0) {
        toast({
          variant: "destructive",
          title: "Not enough history",
          description: "Please search for or view some books to get recommendations.",
        });
        return;
      }
      const result = await recommendBooks(history);
      setRecommendations(result);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast({
        variant: "destructive",
        title: "Recommendation Error",
        description: "Could not fetch recommendations at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedBookDetails = recommendations?.recommendedBooks
    .map(title => allBooks.find(book => book.title.toLowerCase() === title.toLowerCase().replace(/['"]+/g, '')))
    .filter((book): book is Book => book !== undefined);

  return (
    <div className="mt-6 space-y-6 rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold font-headline">Your Personal Bookshelf AI</h3>
          <p className="text-sm text-muted-foreground">
            Click the button to get book recommendations tailored to you.
          </p>
        </div>
        <Button onClick={handleGetRecommendations} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Get Recommendations'
          )}
        </Button>
      </div>

      {recommendedBookDetails && recommendedBookDetails.length > 0 && (
        <div className="pt-6 border-t">
            <h4 className="text-md font-semibold mb-4">Here are some books you might like:</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {recommendedBookDetails.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
      )}

      {recommendations && (!recommendedBookDetails || recommendedBookDetails.length === 0) && (
         <div className="pt-6 border-t">
            <Alert>
                <AlertTitle>Recommendations Ready!</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">We found some books for you, but they are not in our current collection:</p>
                    <ul className="list-disc pl-5">
                        {recommendations.recommendedBooks.map((title, index) => (
                            <li key={index}>{title}</li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>
         </div>
      )}
    </div>
  );
}
