"use client";

import { useState } from 'react';
import type { Book } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Pencil, Book as BookIcon } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddSeriesForm } from './AddSeriesForm';
import { EditSeriesForm } from './EditSeriesForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
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
                  {series.map((seriesName) => (
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
                                  <DropdownMenuItem onClick={() => onSeriesDeleted(seriesName)} className="text-destructive focus:text-destructive">
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
    </>
  );
}
