"use client";

import { useEffect, useState } from 'react';
import type { Genre } from '@/types';
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
import { AddGenreForm } from './AddGenreForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const GENRES_STORAGE_KEY = 'bibliophile-genres';

export function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const { toast } = useToast();

 useEffect(() => {
    const loadGenres = async () => {
      setIsLoading(true);
      try {
        const storedGenres = localStorage.getItem(GENRES_STORAGE_KEY);
        if (storedGenres) {
          setGenres(JSON.parse(storedGenres));
        } else {
          const initialGenres = await fetchAllGenres();
          setGenres(initialGenres);
          localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(initialGenres));
        }
      } catch (error) {
        console.error("Failed to load genres:", error);
        const initialGenres = await fetchAllGenres();
        setGenres(initialGenres);
      } finally {
        setIsLoading(false);
      }
    };
    loadGenres();
  }, []);

  const persistGenres = (updatedGenres: Genre[]) => {
    localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(updatedGenres));
    setGenres(updatedGenres);
  };
  
  const handleGenreAdded = (newGenre: Genre) => {
    const updatedGenres = [newGenre, ...genres];
    persistGenres(updatedGenres);
    toast({
        title: "Thêm thể loại thành công",
        description: `Thể loại "${newGenre.name}" đã được thêm.`,
    });
  };

  const handleGenreDeleted = (genreId: string) => {
    const genreToDelete = genres.find(g => g.id === genreId);
    if (genreToDelete) {
        const updatedGenres = genres.filter(genre => genre.id !== genreId);
        persistGenres(updatedGenres);
        toast({
            variant: "destructive",
            title: "Đã xóa thể loại",
            description: `Thể loại "${genreToDelete.name}" đã được xóa.`,
        });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Quản lý thể loại</CardTitle>
            <CardDescription>Thêm, xóa thể loại sách.</CardDescription>
        </div>
        <Dialog open={isAddGenreOpen} onOpenChange={setIsAddGenreOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Thêm thể loại
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm thể loại mới</DialogTitle>
                </DialogHeader>
                <AddGenreForm onGenreAdded={handleGenreAdded} onFinished={() => setIsAddGenreOpen(false)}/>
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
                  <TableHead>Tên thể loại</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genres.map((genre) => (
                  <TableRow key={genre.id}>
                    <TableCell className="font-medium">{genre.name}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleGenreDeleted(genre.id)} className="text-destructive focus:text-destructive">
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
