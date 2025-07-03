
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Book, Author, Genre } from '@/types';
import { getAllBooks as fetchAllBooks } from '@/lib/books';
import { getAllAuthors as fetchAllAuthors } from '@/lib/authors';
import { getAllGenres as fetchAllGenres } from '@/lib/genres';
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

const BOOKS_STORAGE_KEY = 'bibliophile-books';
const AUTHORS_STORAGE_KEY = 'bibliophile-authors';
const GENRES_STORAGE_KEY = 'bibliophile-genres';
const BOOKS_PER_PAGE = 50;

export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const storedBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
        if (storedBooks) {
          setBooks(JSON.parse(storedBooks));
        } else {
          const initialBooks = await fetchAllBooks();
          setBooks(initialBooks);
          localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(initialBooks));
        }

        const storedAuthors = localStorage.getItem(AUTHORS_STORAGE_KEY);
        if (storedAuthors) {
          setAuthors(JSON.parse(storedAuthors));
        } else {
          const initialAuthors = await fetchAllAuthors();
          setAuthors(initialAuthors);
          localStorage.setItem(AUTHORS_STORAGE_KEY, JSON.stringify(initialAuthors));
        }

        const storedGenres = localStorage.getItem(GENRES_STORAGE_KEY);
        if (storedGenres) {
          setGenres(JSON.parse(storedGenres));
        } else {
          const initialGenres = await fetchAllGenres();
          setGenres(initialGenres);
          localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(initialGenres));
        }
      } catch (error) {
        console.error("Failed to load data from storage, falling back to defaults", error);
        setBooks(await fetchAllBooks());
        setAuthors(await fetchAllAuthors());
        setGenres(await fetchAllGenres());
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleBookAdded = (newBook: Book) => {
    const updatedBooks = [newBook, ...books];
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    toast({
        title: "Thêm sách thành công",
        description: `Sách "${newBook.title}" đã được thêm.`,
    });
  };

  const handleBookDeleted = (bookId: string) => {
    const bookToDelete = books.find(b => b.id === bookId);
    if (bookToDelete) {
      const updatedBooks = books.filter(book => book.id !== bookId);
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
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

  // Pagination logic
  const totalPages = Math.ceil(books.length / BOOKS_PER_PAGE);
  const paginatedBooks = books.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  useEffect(() => {
    const newTotalPages = Math.ceil(books.length / BOOKS_PER_PAGE);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [books, currentPage]);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Quản lý sách</CardTitle>
            <CardDescription>
                Thêm, sửa, xóa sách trong bộ sưu tập. Tổng số sách: {books.length}.
            </CardDescription>
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
                <AddBookForm 
                  onBookAdded={handleBookAdded} 
                  onFinished={() => setIsAddBookOpen(false)}
                  authors={authors}
                  genres={genres}
                />
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
          <>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[60px]">Ảnh bìa</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Thể loại</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedBooks.map((book) => (
                    <TableRow key={book.id}>
                        <TableCell>
                            <Image
                                src={book.coverImage}
                                alt={`Bìa sách ${book.title}`}
                                width={40}
                                height={60}
                                className="rounded-sm object-cover"
                                data-ai-hint="book cover"
                            />
                        </TableCell>
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
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <span className="text-sm text-muted-foreground">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Sau
                    </Button>
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

