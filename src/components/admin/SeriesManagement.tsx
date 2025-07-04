"use client";

import { useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Book as BookIcon } from 'lucide-react';

interface SeriesManagementProps {
  books: Book[];
}

export function SeriesManagement({ books }: SeriesManagementProps) {
  const seriesList = useMemo(() => {
    const allSeries = books
      .map(book => book.series)
      .filter((series): series is string => typeof series === 'string' && series.trim() !== '');
    return [...new Set(allSeries)].sort();
  }, [books]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Series</CardTitle>
        <CardDescription>Danh sách tất cả các series sách hiện có trong hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
         {seriesList.length === 0 ? (
            <Alert>
                <BookIcon className="h-4 w-4" />
                <AlertTitle>Không có Series</AlertTitle>
                <AlertDescription>
                    Hiện chưa có series sách nào trong hệ thống. Bạn có thể thêm series khi tạo hoặc sửa sách.
                </AlertDescription>
            </Alert>
         ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Series</TableHead>
                  <TableHead>Số lượng sách</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesList.map((series) => (
                  <TableRow key={series}>
                    <TableCell className="font-medium">{series}</TableCell>
                    <TableCell>
                        {books.filter(b => b.series === series).length}
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
