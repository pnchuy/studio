
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { FavoriteBooks } from '@/components/admin/FavoriteBooks';
import { CommentManagement } from '@/components/admin/CommentManagement';
import { SecurityTab } from '@/components/manage/SecurityTab';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Lock } from 'lucide-react';
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

type Section = 'favorites' | 'comments' | 'security';

export default function ManagePage() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('favorites');

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, authLoading, router]);

    if (authLoading || !isLoggedIn || !user) {
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

    const navItems = [
        { id: 'favorites', label: 'Sách yêu thích', icon: Heart },
        { id: 'comments', label: 'Bình luận của bạn', icon: MessageSquare },
        { id: 'security', label: 'Bảo mật', icon: Lock },
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
                                <h1 className="text-3xl font-bold tracking-tight font-headline">Trang cá nhân</h1>
                                <p className="text-muted-foreground mt-1">
                                    Quản lý sách yêu thích, bình luận và bảo mật tài khoản.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex-1 mt-8">
                            {activeSection === 'favorites' && <FavoriteBooks />}
                            {activeSection === 'comments' && <CommentManagement />}
                            {activeSection === 'security' && <SecurityTab />}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
