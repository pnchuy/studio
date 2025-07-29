
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Book, Genre } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Pencil, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddGenreForm } from './AddGenreForm';
import { EditGenreForm } from './EditGenreForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface GenreManagementProps {
    genres: Genre[];
    books: Book[];
    isLoading: boolean;
    onGenreAdded: (newGenreData: Omit<Genre, 'id'>) => void;
    onGenreUpdated: (genre: Genre) => void;
    onGenreDeleted: (genreId: string) => void;
}

export function GenreManagement({ genres, books, isLoading, onGenreAdded, onGenreUpdated, onGenreDeleted }: GenreManagementProps) {
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const [isEditGenreOpen, setIsEditGenreOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredAndSortedGenres = useMemo(() => {
     const genresWithBookCount = genres.map(genre => ({
      ...genre,
      bookCount: books.filter(b => b.genreIds.includes(genre.id)).length
    }));

    const filtered = genresWithBookCount.filter(genre =>
      genre.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
        switch (sortOption) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'book_count_desc':
                return b.bookCount - a.bookCount;
            case 'book_count_asc':
                return a.bookCount - b.bookCount;
            default:
                return a.name.localeCompare(b.name);
        }
    });
  }, [genres, books, debouncedSearchTerm, sortOption]);


  const totalPages = Math.ceil(filteredAndSortedGenres.length / itemsPerPage);
  const paginatedGenres = useMemo(() => {
    return filteredAndSortedGenres.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
  }, [filteredAndSortedGenres, currentPage, itemsPerPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredAndSortedGenres.length / itemsPerPage);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [filteredAndSortedGenres.length, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, debouncedSearchTerm, sortOption]);

  const handleGenreAdded = (newGenreData: Omit<Genre, 'id'>) => {
    onGenreAdded(newGenreData);
    toast({
        title: "Thêm thể loại thành công",
        description: `Thể loại "${newGenreData.name}" đã được thêm.`,
    });
  };
  
  const handleEditClick = (genre: Genre) => {
    setEditingGenre(genre);
    setIsEditGenreOpen(true);
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
    <>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                <AddGenreForm 
                    genres={genres}
                    onGenreAdded={handleGenreAdded} 
                    onFinished={() => setIsAddGenreOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Tìm kiếm thể loại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
            />
          </div>
          <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Sắp xếp theo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Tên (A-Z)</SelectItem>
                <SelectItem value="name_desc">Tên (Z-A)</SelectItem>
                <SelectItem value="book_count_desc">Số lượng sách (Nhiều nhất)</SelectItem>
                <SelectItem value="book_count_asc">Số lượng sách (Ít nhất)</SelectItem>
              </SelectContent>
          </Select>
      </div>


      <div>
         {isLoading ? (
          <div className="space-y-4">
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
                    <TableHead>Tên thể loại</TableHead>
                    <TableHead>Số lượng sách</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedGenres.map((genre) => (
                    <TableRow key={genre.id}>
                        <TableCell className="font-medium">{genre.name}</TableCell>
                        <TableCell>{genre.bookCount}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditClick(genre)}>
                                        <Pencil className="mr-2 h-4 w-4"/>
                                        Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGenreToDelete(genre)} className="text-destructive focus:text-destructive">
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
             <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">Hiển thị</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={`${itemsPerPage}`} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">kết quả trong tổng số {filteredAndSortedGenres.length}</p>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2">
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
            </div>
          </>
        )}
      </div>
    </div>
    <Dialog open={isEditGenreOpen} onOpenChange={setIsEditGenreOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Sửa tên thể loại</DialogTitle>
            </DialogHeader>
            {editingGenre && (
                <EditGenreForm 
                    genreToEdit={editingGenre}
                    genres={genres}
                    onGenreUpdated={onGenreUpdated} 
                    onFinished={() => {
                        setIsEditGenreOpen(false);
                        setEditingGenre(null);
                    }}
                />
            )}
        </DialogContent>
    </Dialog>
    <AlertDialog open={!!genreToDelete} onOpenChange={(isOpen) => !isOpen && setGenreToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn thể loại "{genreToDelete?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (genreToDelete) {
                            handleGenreDeleted(genreToDelete.id);
                            setGenreToDelete(null);
                        }
                    }} 
                    className={buttonVariants({ variant: "destructive" })}
                >
                    Xóa
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    
