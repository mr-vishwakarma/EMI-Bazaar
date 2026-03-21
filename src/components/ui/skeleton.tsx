import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-md bg-muted/20",
                shimmer && "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-accent/10 after:to-transparent",
                className
            )}
            {...props}
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-card border border-border/50 rounded-[2.5rem] p-5 flex flex-col h-full space-y-4">
            <Skeleton className="aspect-square rounded-[2rem] w-full" />
            <div className="space-y-2 px-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-card border border-border/60 rounded-[2.5rem] p-6 space-y-4">
            <div className="flex justify-between items-start">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-16 h-4 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4 w-full">
            <div className="flex gap-4 px-4 py-2 border-b">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/5 border border-border/40">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
            ))}
        </div>
    );
}
