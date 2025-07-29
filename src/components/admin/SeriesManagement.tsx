
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Book, Series } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Pencil, Book as BookIcon, Search } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddSeriesForm } from './AddSeriesForm';
import { EditSeriesForm } from './EditSeriesForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface SeriesManagementProps {
  series: Series[];
  books: Book[];
  isLoading: boolean;
  onSeriesAdded: (seriesData: { name: string }) => void;
  onSeriesDeleted: (seriesId: string) => void;
  onSeriesUpdated: (seriesId: string, newName: string) => void;
}

export function SeriesManagement({ series, books, isLoading, onSeriesAdded, onSeriesDeleted, onSeriesUpdated }: SeriesManagementProps) {
  const [isAddSeriesOpen, setIsAddSeriesOpen] = useState(false);
  const [isEditSeriesOpen, setIsEditSeriesOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSeries = useMemo(() => {
    const sorted = [...series].sort((a, b) => a.name.localeCompare(b.name));
    return sorted.filter(s =>
      s.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [series, debouncedSearchTerm]);


  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const paginatedSeries = useMemo(() => {
    return filteredSeries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
  }, [filteredSeries, currentPage, itemsPerPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredSeries.length / itemsPerPage);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [filteredSeries.length, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, debouncedSearchTerm]);
  
  const handleEditClick = (seriesItem: Series) => {
    setEditingSeries(seriesItem);
    setIsEditSeriesOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
              <h3 className="text-xl font-semibold tracking-tight">Quản lý Series</h3>
              <p className="text-sm text-muted-foreground mt-1">Thêm, sửa, xóa series sách trong hệ thống.</p>
          </div>
          <Dialog open={isAddSeriesOpen} onOpenChange={setIsAddSeriesOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <PlusCircle className="mr-2" />
                      Thêm Series
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                  <DialogHeader>
                      <DialogTitle>Thêm Series Mới</DialogTitle>
                  </DialogHeader>
                  <AddSeriesForm 
                    series={series.map(s => s.name)}
                    onSeriesAdded={(name) => onSeriesAdded({ name })} 
                    onFinished={() => setIsAddSeriesOpen(false)}
                   />
              </DialogContent>
          </Dialog>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div>
          {isLoading ? (
              <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </div>
          ) : series.length === 0 ? (
              <Alert>
                  <BookIcon className="h-4 w-4" />
                  <AlertTitle>Không có Series</AlertTitle>
                  <AlertDescription>
                      Hiện chưa có series sách nào trong hệ thống. Bạn có thể thêm series mới.
                  </AlertDescription>
              </Alert>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Series</TableHead>
                      <TableHead>Số lượng sách</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSeries.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                            {books.filter(b => b.series === s.name).length}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditClick(s)}>
                                        <Pencil className="mr-2 h-4 w-4"/>
                                        Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSeriesToDelete(s)} className="text-destructive focus:text-destructive">
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
                      <p className="text-sm text-muted-foreground">kết quả trong tổng số {filteredSeries.length}</p>
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

      <Dialog open={isEditSeriesOpen} onOpenChange={setIsEditSeriesOpen}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>Sửa tên Series</DialogTitle>
              </DialogHeader>
              {editingSeries && (
                <EditSeriesForm 
                  seriesToEdit={editingSeries} 
                  series={series}
                  onSeriesUpdated={onSeriesUpdated} 
                  onFinished={() => {
                    setIsEditSeriesOpen(false);
                    setEditingSeries(null);
                  }}
                />
              )}
          </DialogContent>
      </Dialog>
      <AlertDialog open={!!seriesToDelete} onOpenChange={(isOpen) => !isOpen && setSeriesToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn series "{seriesToDelete?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (seriesToDelete) {
                            onSeriesDeleted(seriesToDelete.id);
                            setSeriesToDelete(null);
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
