"use client";

import { useEffect, useState } from 'react';
import type { Genre } from '@/types';
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


export function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genreList = await getAllGenres();
        setGenres(genreList);
      } catch (error) {
        console.error("Failed to fetch genres", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenres();
  }, []);
  
  const handleGenreAdded = (newGenre: Genre) => {
    setGenres(prev => [newGenre, ...prev]);
    toast({
        title: "Thêm thể loại thành công",
        description: `Thể loại "${newGenre.name}" đã được thêm.`,
    });
  };

  const handleGenreDeleted = (genreId: string) => {
    const genreToDelete = genres.find(g => g.id === genreId);
    setGenres(prev => prev.filter(genre => genre.id !== genreId));
    if (genreToDelete) {
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
