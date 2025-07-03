"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookManagement } from '@/components/admin/BookManagement';
import { AuthorManagement } from '@/components/admin/AuthorManagement';
import { GenreManagement } from '@/components/admin/GenreManagement';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { FavoriteBooks } from '@/components/admin/FavoriteBooks';
import { CommentManagement } from '@/components/admin/CommentManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, authLoading, router]);

    if (authLoading || !isLoggedIn || !user) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    const isMember = user.role === 'MEMBER';
    
    const getDefaultTab = () => {
        if (isAdminOrManager) return "books";
        if (isMember) return "favorites";
        return "comments";
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Trang quản trị</h1>
            <p className="text-muted-foreground mt-2">
            {isAdminOrManager ? "Quản lý sách, tác giả, thể loại và thành viên của Bibliophile." : "Quản lý các mục yêu thích và bình luận của bạn."}
            </p>
        </div>
        <Tabs defaultValue={getDefaultTab()} className="space-y-4">
            <TabsList>
            {isAdminOrManager && (
                <>
                    <TabsTrigger value="books">Quản lý sách</TabsTrigger>
                    <TabsTrigger value="authors">Quản lý tác giả</TabsTrigger>
                    <TabsTrigger value="genres">Quản lý thể loại</TabsTrigger>
                    <TabsTrigger value="members">Quản lý thành viên</TabsTrigger>
                </>
            )}
             {isMember && (
                <TabsTrigger value="favorites">Sách yêu thích</TabsTrigger>
             )}
             <TabsTrigger value="comments">Bình luận</TabsTrigger>
            </TabsList>

            {isAdminOrManager && (
                <>
                    <TabsContent value="books">
                        <BookManagement />
                    </TabsContent>
                    <TabsContent value="authors">
                        <AuthorManagement />
                    </TabsContent>
                     <TabsContent value="genres">
                        <GenreManagement />
                    </TabsContent>
                    <TabsContent value="members">
                        <MemberManagement />
                    </TabsContent>
                </>
            )}
            {isMember && (
                 <TabsContent value="favorites">
                    <FavoriteBooks />
                </TabsContent>
            )}
             <TabsContent value="comments">
                <CommentManagement />
            </TabsContent>
        </Tabs>
        </div>
    );
}
