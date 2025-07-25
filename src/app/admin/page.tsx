
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BookManagement } from '@/components/admin/BookManagement';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Users, Database } from 'lucide-react';
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarTrigger, 
    SidebarContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarInset 
} from '@/components/ui/sidebar';

type Section = 'collection' | 'members';

export default function AdminPage() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('collection');

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
        <SidebarProvider>
            <div className="flex">
                <Sidebar>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => setActiveSection('collection')} isActive={activeSection === 'collection'} tooltip="Quản lý Bộ sưu tập">
                                    <Database />
                                    <span>Quản lý Bộ sưu tập</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => setActiveSection('members')} isActive={activeSection === 'members'} tooltip="Quản lý Thành viên">
                                    <Users />
                                    <span>Quản lý Thành viên</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset className="flex-1">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight font-headline">Trang quản trị</h1>
                                <p className="text-muted-foreground mt-1">
                                    Quản lý sách, tác giả, thể loại và thành viên của Bibliophile.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex-1 mt-8">
                            {activeSection === 'collection' && <BookManagement />}
                            {activeSection === 'members' && <MemberManagement />}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
