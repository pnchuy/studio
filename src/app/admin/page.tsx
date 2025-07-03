"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookManagement } from '@/components/admin/BookManagement';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, authLoading, router]);

    if (authLoading || !isLoggedIn) {
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
        <h1 className="text-3xl font-bold tracking-tight font-headline">Trang quản trị</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý sách và thành viên của Bibliophile.
        </p>
      </div>
      <Tabs defaultValue="books" className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">Quản lý sách</TabsTrigger>
          <TabsTrigger value="members">Quản lý thành viên</TabsTrigger>
        </TabsList>
        <TabsContent value="books">
            <BookManagement />
        </TabsContent>
        <TabsContent value="members">
            <MemberManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
