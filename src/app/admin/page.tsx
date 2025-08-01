
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BookManagement } from '@/components/admin/BookManagement';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { SystemManagement } from '@/components/admin/SystemManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading) {
            if (!isLoggedIn) {
                router.push('/login');
            } else if (user?.role === 'MEMBER') {
                router.push('/manage');
            }
        }
    }, [isLoggedIn, authLoading, router, user]);

    if (authLoading || !isLoggedIn || !user || user.role === 'MEMBER') {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="lg:w-1/4">
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </aside>
                    <div className="flex-1">
                        <Skeleton className="h-96 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Trang quản trị</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý sách, tác giả, thể loại và thành viên của Bibliophile.
                </p>
            </div>
            
             <Tabs defaultValue="collection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="collection">Quản lý Bộ sưu tập</TabsTrigger>
                    <TabsTrigger value="members">Quản lý Thành viên</TabsTrigger>
                    <TabsTrigger value="system">Hệ thống</TabsTrigger>
                </TabsList>
                <TabsContent value="collection">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bộ sưu tập sách</CardTitle>
                            <CardDescription>
                                Thêm, sửa, xóa sách, tác giả, thể loại và series.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BookManagement />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="members">
                    <MemberManagement />
                </TabsContent>
                <TabsContent value="system">
                    <SystemManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
