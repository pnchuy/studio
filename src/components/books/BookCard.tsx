import Link from 'next/link';
import Image from 'next/image';
import type { BookWithDetails } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BookCardProps {
  book: BookWithDetails;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/book/${book.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={book.coverImage}
              alt={`Cover of ${book.title}`}
              fill
              className="object-cover"
              data-ai-hint="book cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-headline leading-tight group-hover:text-primary line-clamp-2 h-[2.5em]">
            {book.title}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground truncate">{book.author?.name || 'Unknown Author'}</p>
          {book.series && <Badge variant="secondary" className="mt-2">{book.series}</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}
