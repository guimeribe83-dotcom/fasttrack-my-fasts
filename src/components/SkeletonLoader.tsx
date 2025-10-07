import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const FastCardSkeleton = () => (
  <Card className="p-4 md:p-6">
    <div className="flex flex-col md:flex-row md:items-start gap-4">
      <div className="flex-1 space-y-4">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex md:flex-col gap-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  </Card>
);

export const ProgressSkeleton = () => (
  <Card className="p-4 md:p-6 bg-card border-border shadow-none">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <Skeleton className="h-[140px] w-[140px] rounded-full" />
      <div className="flex-1 w-full space-y-4">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </Card>
);

export const BlockSkeleton = () => (
  <Card className="p-4">
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
  </Card>
);

export const CalendarSkeleton = () => (
  <Card className="p-6 shadow-sm">
    <Skeleton className="h-6 w-48 mb-6" />
    <div className="grid grid-cols-7 gap-3 mb-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-3">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  </Card>
);
