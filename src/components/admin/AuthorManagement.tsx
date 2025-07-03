"use client";

import { useEffect, useState } from 'react';
import type { Author } from '@/types';
import { getAllAuthors as fetchAllAuthors } from '@/lib/authors';
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
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
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
import { AddAuthorForm } from './AddAuthorForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const AUTHORS_STORAGE_KEY = 'bibliophile-authors';

export function AuthorManagement() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadAuthors = async () => {
      setIsLoading(true);
      try {
        const storedAuthors = localStorage.getItem(AUTHORS_STORAGE_KEY);
        if (storedAuthors) {
          setAuthors(JSON.parse(storedAuthors));
        } else {
          const initialAuthors = await fetchAllAuthors();
          setAuthors(initialAuthors);
          localStorage.setItem(AUTHORS_STORAGE_KEY, JSON.stringify(initialAuthors));
        }
      } catch (error) {
        console.error("Failed to load authors:", error);
        const initialAuthors = await fetchAllAuthors();
        setAuthors(initialAuthors);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthors();
  }, []);

  const persistAuthors = (updatedAuthors: Author[]) => {
    localStorage.setItem(AUTHORS_STORAGE_KEY, JSON.stringify(updatedAuthors));
    setAuthors(updatedAuthors);
  };
  
  const handleAuthorAdded = (newAuthor: Author) => {
    const updatedAuthors = [newAuthor, ...authors];
    persistAuthors(updatedAuthors);
    toast({
        title: "Thêm tác giả thành công",
        description: `Tác giả "${newAuthor.name}" đã được thêm.`,
    });
  };

  const handleAuthorDeleted = (authorId: string) => {
    const authorToDelete = authors.find(b => b.id === authorId);
    if (authorToDelete) {
      const updatedAuthors = authors.filter(author => author.id !== authorId);
      persistAuthors(updatedAuthors);
      toast({
          variant: "destructive",
          title: "Đã xóa tác giả",
          description: `Tác giả "${authorToDelete.name}" đã được xóa.`,
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Quản lý tác giả</CardTitle>
            <CardDescription>Thêm, xóa tác giả trong hệ thống.</CardDescription>
        </div>
        <Dialog open={isAddAuthorOpen} onOpenChange={setIsAddAuthorOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Thêm tác giả
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm tác giả mới</DialogTitle>
                </DialogHeader>
                <AddAuthorForm onAuthorAdded={handleAuthorAdded} onFinished={() => setIsAddAuthorOpen(false)}/>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
         {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên tác giả</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell className="font-medium">{author.name}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleAuthorDeleted(author.id)} className="text-destructive focus:text-destructive">
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
