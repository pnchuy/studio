
"use client";

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton';

const ClientSiteHeader = dynamic(() => import('@/components/ClientSiteHeader').then(mod => mod.ClientSiteHeader), {
    ssr: false,
    loading: () => (
         <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </header>
    )
});

export function SiteHeader() {
  return <ClientSiteHeader />;
}
