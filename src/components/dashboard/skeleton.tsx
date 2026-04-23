import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-800/50", className)}
      {...props}
    />
  )
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="md:col-span-2 h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 h-56 flex flex-col justify-between">
      <div className="space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function FolderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RetentionSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-64 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Skeleton className="md:col-span-8 h-[400px] rounded-2xl" />
        <Skeleton className="md:col-span-4 h-[400px] rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl w-full" />
    </div>
  )
}
