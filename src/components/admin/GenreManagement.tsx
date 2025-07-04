"use client";

import { useState } from 'react';
import type { Genre } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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

interface GenreManagementProps {
    genres: Genre[];
    isLoading: boolean;
    onGenreAdded: (newGenre: Genre) => void;
    onGenreDeleted: (genreId: string) => void;
}

export function GenreManagement({ genres, isLoading, onGenreAdded, onGenreDeleted }: GenreManagementProps) {
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const { toast } = useToast();

  const handleGenreAdded = (newGenre: Genre) => {
    onGenreAdded(newGenre);
    toast({
        title: "Thêm thể loại thành công",
        description: `Thể loại "${newGenre.name}" đã được thêm.`,
    });
  };

  const handleGenreDeleted = (genreId: string) => {
    const genreToDelete = genres.find(g => g.id === genreId);
    onGenreDeleted(genreId);
    if (genreToDelete) {
        toast({
            variant: "destructive",
            title: "Đã xóa thể loại",
            description: `Thể loại "${genreToDelete.name}" đã được xóa.`,
        });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div>
            <h3 className="text-xl font-semibold tracking-tight">Quản lý thể loại</h3>
            <p className="text-sm text-muted-foreground mt-1">Thêm, xóa thể loại sách.</p>
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
      </div>
      <div>
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
      </div>
    </div>
  );
}
