"use client";

import { useEffect, useState } from 'react';
import type { Book, Author, Genre } from '@/types';
import { getAllBooks } from '@/lib/books';
import { getAllAuthors } from '@/lib/authors';
import { getAllGenres } from '@/lib/genres';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddBookForm } from './AddBookForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookList, authorList, genreList] = await Promise.all([
          getAllBooks(),
          getAllAuthors(),
          getAllGenres(),
        ]);
        setBooks(bookList);
        setAuthors(authorList);
        setGenres(genreList);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleBookAdded = (newBook: Book) => {
    setBooks(prevBooks => [newBook, ...prevBooks]);
    toast({
        title: "Thêm sách thành công",
        description: `Sách "${newBook.title}" đã được thêm.`,
    });
  };

  const handleBookDeleted = (bookId: string) => {
    const bookToDelete = books.find(b => b.id === bookId);
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    if (bookToDelete) {
        toast({
            variant: "destructive",
            title: "Đã xóa sách",
            description: `Sách "${bookToDelete.title}" đã được xóa.`,
        });
    }
  }

  const getAuthorName = (authorId: string) => {
    return authors.find(a => a.id === authorId)?.name || 'N/A';
  }

  const getGenreNames = (genreIds: string[]) => {
    return genreIds.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', ');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Quản lý sách</CardTitle>
            <CardDescription>Thêm, sửa, xóa sách trong bộ sưu tập.</CardDescription>
        </div>
        <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Thêm sách
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thêm sách mới</DialogTitle>
                </DialogHeader>
                <AddBookForm onBookAdded={handleBookAdded} onFinished={() => setIsAddBookOpen(false)}/>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
         {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Thể loại</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{getAuthorName(book.authorId)}</TableCell>
                    <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground truncate">
                            {getGenreNames(book.genreIds)}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem disabled>
                                    <Pencil className="mr-2 h-4 w-4"/>
                                    Sửa (Chưa hỗ trợ)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBookDeleted(book.id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
