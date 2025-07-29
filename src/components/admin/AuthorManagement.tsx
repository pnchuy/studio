
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Author, Book } from '@/types';
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
import { AddAuthorForm } from './AddAuthorForm';
import { EditAuthorForm } from './EditAuthorForm';
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

interface AuthorManagementProps {
    authors: Author[];
    books: Book[];
    isLoading: boolean;
    onAuthorAdded: (newAuthorData: Omit<Author, 'id'>) => void;
    onAuthorUpdated: (author: Author) => void;
    onAuthorDeleted: (authorId: string) => void;
}

export function AuthorManagement({ authors, books, isLoading, onAuthorAdded, onAuthorUpdated, onAuthorDeleted }: AuthorManagementProps) {
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [isEditAuthorOpen, setIsEditAuthorOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const { toast } = useToast();
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredAndSortedAuthors = useMemo(() => {
    const authorsWithBookCount = authors.map(author => ({
      ...author,
      bookCount: books.filter(b => b.authorId === author.id).length
    }));

    const filtered = authorsWithBookCount.filter(author =>
      author.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
  }, [authors, books, debouncedSearchTerm, sortOption]);


  const totalPages = Math.ceil(filteredAndSortedAuthors.length / itemsPerPage);
  const paginatedAuthors = useMemo(() => {
    return filteredAndSortedAuthors.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
  }, [filteredAndSortedAuthors, currentPage, itemsPerPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredAndSortedAuthors.length / itemsPerPage);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [filteredAndSortedAuthors.length, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, debouncedSearchTerm, sortOption]);
  
  const handleAuthorAdded = (newAuthorData: Omit<Author, 'id'>) => {
    onAuthorAdded(newAuthorData);
    toast({
        title: "Thêm tác giả thành công",
        description: `Tác giả "${newAuthorData.name}" đã được thêm.`,
    });
  };

  const handleEditClick = (author: Author) => {
    setEditingAuthor(author);
    setIsEditAuthorOpen(true);
  };

  const handleAuthorDeleted = (authorId: string) => {
    const authorToDelete = authors.find(b => b.id === authorId);
    onAuthorDeleted(authorId);
    if (authorToDelete) {
      toast({
          variant: "destructive",
          title: "Đã xóa tác giả",
          description: `Tác giả "${authorToDelete.name}" đã được xóa.`,
      });
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h3 className="text-xl font-semibold tracking-tight">Quản lý tác giả</h3>
            <p className="text-sm text-muted-foreground mt-1">Thêm, xóa tác giả trong hệ thống.</p>
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
                <AddAuthorForm 
                    authors={authors}
                    onAuthorAdded={handleAuthorAdded} 
                    onFinished={() => setIsAddAuthorOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>
      
       <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Tìm kiếm tác giả..."
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
                    <TableHead>Tên tác giả</TableHead>
                    <TableHead>Số lượng sách</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedAuthors.map((author) => (
                    <TableRow key={author.id}>
                        <TableCell className="font-medium">{author.name}</TableCell>
                        <TableCell>{author.bookCount}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditClick(author)}>
                                        <Pencil className="mr-2 h-4 w-4"/>
                                        Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAuthorToDelete(author)} className="text-destructive focus:text-destructive">
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
                    <p className="text-sm text-muted-foreground">kết quả trong tổng số {filteredAndSortedAuthors.length}</p>
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
    <Dialog open={isEditAuthorOpen} onOpenChange={setIsEditAuthorOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Sửa thông tin tác giả</DialogTitle>
            </DialogHeader>
            {editingAuthor && (
                <EditAuthorForm 
                    authorToEdit={editingAuthor}
                    authors={authors}
                    onAuthorUpdated={onAuthorUpdated} 
                    onFinished={() => {
                        setIsEditAuthorOpen(false);
                        setEditingAuthor(null);
                    }}
                />
            )}
        </DialogContent>
    </Dialog>
     <AlertDialog open={!!authorToDelete} onOpenChange={(isOpen) => !isOpen && setAuthorToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn tác giả "{authorToDelete?.name}". Việc này có thể ảnh hưởng đến các sách có liên quan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (authorToDelete) {
                            handleAuthorDeleted(authorToDelete.id);
                            setAuthorToDelete(null);
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
