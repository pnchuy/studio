
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Book as BookIcon } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

interface SeriesManagementProps {
  series: string[];
  books: Book[];
  isLoading: boolean;
  onSeriesAdded: (seriesName: string) => void;
  onSeriesDeleted: (seriesName: string) => void;
}

export function SeriesManagement({ series, books, isLoading, onSeriesAdded, onSeriesDeleted }: SeriesManagementProps) {
  const [isAddSeriesOpen, setIsAddSeriesOpen] = useState(false);
  
  const handleSeriesAdded = (newSeries: string) => {
    onSeriesAdded(newSeries);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Quản lý Series</CardTitle>
            <CardDescription>Thêm hoặc xóa series sách trong hệ thống.</CardDescription>
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
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

    