"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FavoriteBooks } from '@/components/admin/FavoriteBooks';
import { CommentManagement } from '@/components/admin/CommentManagement';
import { SecurityTab } from '@/components/manage/SecurityTab';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Lock } from 'lucide-react';

export default function ManagePage() {
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Trang cá nhân</h1>
                <p className="text-muted-foreground mt-2">
                    Quản lý sách yêu thích, bình luận và bảo mật tài khoản.
                </p>
            </div>
            <Tabs defaultValue="favorites" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="favorites">
                        <Heart className="mr-2 h-4 w-4" />
                        Sách yêu thích
                    </TabsTrigger>
                    <TabsTrigger value="comments">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Bình luận của bạn
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Lock className="mr-2 h-4 w-4" />
                        Bảo mật
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="favorites">
                    <FavoriteBooks />
                </TabsContent>
                <TabsContent value="comments">
                    <CommentManagement />
                </TabsContent>
                <TabsContent value="security">
                    <SecurityTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
