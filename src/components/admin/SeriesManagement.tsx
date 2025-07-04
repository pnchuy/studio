
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Book } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Pencil, Book as BookIcon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeriesManagementProps {
  series: string[];
  books: Book[];
  isLoading: boolean;
  onSeriesAdded: (seriesName: string) => void;
  onSeriesDeleted: (seriesName: string) => void;
  onSeriesUpdated: (oldName: string, newName: string) => void;
}

export function SeriesManagement({ series, books, isLoading, onSeriesAdded, onSeriesDeleted, onSeriesUpdated }: SeriesManagementProps) {
  const [isAddSeriesOpen, setIsAddSeriesOpen] = useState(false);
  const [isEditSeriesOpen, setIsEditSeriesOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(series.length / itemsPerPage);
  const paginatedSeries = useMemo(() => {
    return series.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
  }, [series, currentPage, itemsPerPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(series.length / itemsPerPage);
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages));
    }
  }, [series.length, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);
  
  const handleSeriesAdded = (newSeries: string) => {
    onSeriesAdded(newSeries);
  };

  const handleEditClick = (seriesName: string) => {
    setEditingSeries(seriesName);
    setIsEditSeriesOpen(true);
  }

  const handleSeriesUpdated = (oldName: string, newName: string) => {
    onSeriesUpdated(oldName, newName);
    toast({
        title: "Cập nhật Series thành công",
        description: `Series "${oldName}" đã được đổi tên thành "${newName}".`,
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-between">
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
                  <AddSeriesForm onSeriesAdded={handleSeriesAdded} onFinished={() => setIsAddSeriesOpen(false)}/>
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
              <p className="text-sm text-muted-foreground mb-4">Tổng số series: {series.length}.</p>
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
                    {paginatedSeries.map((seriesName) => (
                      <TableRow key={seriesName}>
                        <TableCell className="font-medium">{seriesName}</TableCell>
                        <TableCell>
                            {books.filter(b => b.series === seriesName).length}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditClick(seriesName)}>
                                        <Pencil className="mr-2 h-4 w-4"/>
                                        Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSeriesToDelete(seriesName)} className="text-destructive focus:text-destructive">
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
                      <p className="text-sm text-muted-foreground">kết quả</p>
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
                  onSeriesUpdated={handleSeriesUpdated} 
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
                    Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn series "{seriesToDelete}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (seriesToDelete) {
                            onSeriesDeleted(seriesToDelete);
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
