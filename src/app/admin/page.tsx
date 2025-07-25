
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BookManagement } from '@/components/admin/BookManagement';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Users } from 'lucide-react';
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarHeader, 
    SidebarTrigger, 
    SidebarContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarInset 
} from '@/components/ui/sidebar';

type Section = 'books' | 'members';

export default function AdminPage() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('books');

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

    const navItems = [
        { id: 'books', label: 'Quản lý sách', icon: Book },
        { id: 'members', label: 'Quản lý thành viên', icon: Users },
    ];
    
    return (
        <SidebarProvider>
            <div className="flex">
                <Sidebar>
                    <SidebarContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        onClick={() => setActiveSection(item.id as Section)}
                                        isActive={activeSection === item.id}
                                        tooltip={item.label}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
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
                            {activeSection === 'books' && <BookManagement />}
                            {activeSection === 'members' && <MemberManagement />}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
