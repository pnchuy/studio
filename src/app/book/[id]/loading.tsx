import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <article>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="md:col-span-1">
                    <Skeleton className="aspect-[2/3] w-full max-w-sm mx-auto rounded-lg" />
                </div>
                <div className="md:col-span-2">
                    <Skeleton className="h-10 w-3/4 rounded-md" />
                    <Skeleton className="h-6 w-1/2 mt-3 rounded-md" />
                    
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-5 w-48 rounded-md" />
                        </div>
                         <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-5 w-64 rounded-md" />
                        </div>
                         <div className="flex items-start gap-3">
                            <Skeleton className="h-5 w-5 rounded-full mt-1" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-8 flex flex-wrap items-center gap-4">
                        <Skeleton className="h-11 w-40 rounded-md" />
                        <Skeleton className="h-11 w-44 rounded-md" />
                        <Skeleton className="h-11 w-40 rounded-md" />
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <Skeleton className="h-8 w-48 mb-4 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full rounded-md" />
                    <Skeleton className="h-5 w-full rounded-md" />
                    <Skeleton className="h-5 w-5/6 rounded-md" />
                </div>
            </div>
            
            <div className="mt-12">
                <Skeleton className="h-8 w-56 mb-4 rounded-md" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        </article>
    )
}
