'use server';

/**
 * @fileOverview Recommends books to the user based on their previous searches and viewed books.
 *
 * - recommendBooks - A function that handles the book recommendation process.
 * - RecommendBooksInput - The input type for the recommendBooks function.
 * - RecommendBooksOutput - The return type for the recommendBooks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendBooksInputSchema = z.object({
  previousSearches: z
    .array(z.string())
    .describe('The user previous searches.')
    .optional(),
  viewedBooks: z
    .array(z.string())
    .describe('The titles of the books the user has viewed.')
    .optional(),
});
export type RecommendBooksInput = z.infer<typeof RecommendBooksInputSchema>;

const RecommendBooksOutputSchema = z.object({
  recommendedBooks: z
    .array(z.string())
    .describe('The titles of the recommended books.'),
});
export type RecommendBooksOutput = z.infer<typeof RecommendBooksOutputSchema>;

export async function recommendBooks(input: RecommendBooksInput): Promise<RecommendBooksOutput> {
  return recommendBooksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendBooksPrompt',
  input: {schema: RecommendBooksInputSchema},
  output: {schema: RecommendBooksOutputSchema},
  prompt: `You are a book recommendation expert. Based on the user's previous searches:

{{#if previousSearches}}
Previous Searches:
{{#each previousSearches}}
- {{this}}
{{/each}}
{{else}}
No previous searches.
{{/if}}

And the books the user has viewed:

{{#if viewedBooks}}
Viewed Books:
{{#each viewedBooks}}
- {{this}}
{{/each}}
{{else}}
No viewed books.
{{/if}}

Recommend 3 books the user might be interested in.  Only include the book titles in your response. Enclose each book title in quotes.
`,
});

const recommendBooksFlow = ai.defineFlow(
  {
    name: 'recommendBooksFlow',
    inputSchema: RecommendBooksInputSchema,
    outputSchema: RecommendBooksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
