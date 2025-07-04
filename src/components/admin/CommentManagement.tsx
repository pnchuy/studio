
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Comment, Book } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { getAllBooks } from '@/lib/books';
import { slugify } from '@/lib/utils';
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
import { MoreHorizontal, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMMENTS_STORAGE_KEY_PREFIX = 'bibliophile-comments-';

export function CommentManagement() {
    const { user } = useAuth();
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [editedText, setEditedText] = useState("");
    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const books = await getAllBooks();
            setAllBooks(books);

            const comments: Comment[] = [];
            books.forEach(book => {
                const storedComments = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${book.id}`);
                if (storedComments) {
                    const bookComments: Comment[] = JSON.parse(storedComments);
                    comments.push(...bookComments);
                }
            });
            setAllComments(comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Failed to load comments data", error);
            toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải dữ liệu bình luận." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user, loadAllData]);

    const persistCommentsForBook = (bookId: string, updatedComments: Comment[]) => {
        try {
            localStorage.setItem(`${COMMENTS_STORAGE_KEY_PREFIX}${bookId}`, JSON.stringify(updatedComments));
        } catch (error) {
            console.error("Could not save comments to localStorage", error);
        }
    };

    const handleEditClick = (comment: Comment) => {
        setEditingComment(comment);
        setEditedText(comment.text);
    };

    const handleSaveEdit = () => {
        if (!editingComment) return;

        const stored = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${editingComment.bookId}`);
        if (stored) {
            let bookComments: Comment[] = JSON.parse(stored);
            
            const updatedBookComments = bookComments.map(c => 
                c.id === editingComment.id 
                    ? { ...c, text: editedText, editedAt: new Date().toISOString() } 
                    : c
            );

            persistCommentsForBook(editingComment.bookId, updatedBookComments);
            
            setAllComments(prev => prev.map(c => 
                c.id === editingComment.id 
                    ? { ...c, text: editedText, editedAt: new Date().toISOString() } 
                    : c
            ));

            toast({ title: "Thành công", description: "Bình luận của bạn đã được cập nhật." });
            setEditingComment(null);
            setEditedText("");
        } else {
             toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy bình luận để cập nhật." });
        }
    };

    const handleDelete = (commentToDelete: Comment) => {
         const stored = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${commentToDelete.bookId}`);
         if (stored) {
            let bookComments: Comment[] = JSON.parse(stored);
            const updatedBookComments = bookComments.filter(c => c.id !== commentToDelete.id);
            persistCommentsForBook(commentToDelete.bookId, updatedBookComments);
            
            setAllComments(prev => prev.filter(c => c.id !== commentToDelete.id));
            toast({ variant: "destructive", title: "Đã xóa", description: "Bình luận đã được xóa thành công." });
        }
    };

    const getBookTitle = (bookId: string) => allBooks.find(b => b.id === bookId)?.title || "Sách không xác định";
    
    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const commentsToDisplay = isAdminOrManager ? allComments : allComments.filter(c => c.userId === user?.id);

    const totalPages = Math.ceil(commentsToDisplay.length / itemsPerPage);
    const paginatedComments = useMemo(() => {
        return commentsToDisplay.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [commentsToDisplay, currentPage, itemsPerPage]);

    useEffect(() => {
        const newTotalPages = Math.ceil(commentsToDisplay.length / itemsPerPage);
        if (currentPage > newTotalPages) {
        setCurrentPage(Math.max(1, newTotalPages));
        }
    }, [commentsToDisplay.length, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
             </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý bình luận</CardTitle>
                    <CardDescription>
                        {isAdminOrManager ? "Xem và xóa tất cả bình luận của người dùng." : "Quản lý các bình luận bạn đã đăng."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {commentsToDisplay.length === 0 ? (
                        <Alert>
                            <MessageSquare className="h-4 w-4" />
                            <AlertTitle>Không có bình luận</AlertTitle>
                            <AlertDescription>
                                {isAdminOrManager ? "Chưa có bình luận nào trong hệ thống." : "Bạn chưa đăng bình luận nào."}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                        <p className="text-sm text-muted-foreground mb-4">Tổng số bình luận: {commentsToDisplay.length}.</p>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Bình luận</TableHead>
                                        {isAdminOrManager && <TableHead>Người dùng</TableHead>}
                                        <TableHead>Trong sách</TableHead>
                                        <TableHead>Ngày đăng</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedComments.map((comment) => {
                                        const bookTitle = getBookTitle(comment.bookId);
                                        const bookSlug = slugify(bookTitle);
                                        const bookUrl = `/book/${comment.bookId}${bookSlug ? `-${bookSlug}` : ''}`;
                                        
                                        return (
                                        <TableRow key={comment.id}>
                                            <TableCell>
                                                <p className="line-clamp-2">{comment.text}</p>
                                                {comment.editedAt && <p className="text-xs text-muted-foreground">(đã sửa)</p>}
                                            </TableCell>
                                            {isAdminOrManager && <TableCell>{comment.userName}</TableCell>}
                                            <TableCell>
                                                <Button variant="link" asChild className="p-0 h-auto font-normal">
                                                    <Link href={bookUrl} className="line-clamp-1 text-left">
                                                        {bookTitle}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <span title={new Date(comment.createdAt).toLocaleString()}>
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        {!isAdminOrManager && (
                                                            <DropdownMenuItem onClick={() => handleEditClick(comment)} className="cursor-pointer">
                                                                <Pencil className="mr-2 h-4 w-4"/>
                                                                Sửa
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleDelete(comment)} className="text-destructive focus:text-destructive cursor-pointer">
                                                            <Trash2 className="mr-2 h-4 w-4"/>
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )})}
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
                </CardContent>
            </Card>

            <Dialog open={!!editingComment} onOpenChange={(isOpen) => !isOpen && setEditingComment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sửa bình luận</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingComment(null)}>Hủy</Button>
                        <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
