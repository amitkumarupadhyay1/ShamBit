'use client';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-200">
      <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
      <Skeleton className="h-4 w-20 mx-auto mb-2" />
      <Skeleton className="h-3 w-16 mx-auto mb-2" />
      <Skeleton className="h-3 w-24 mx-auto" />
    </div>
  );
}

export function SellerCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border border-neutral-200">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-8 w-full rounded" />
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-neutral-200">
        <div className="bg-primary-500 h-10" />
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div>
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="flex-1 h-12 rounded-lg max-w-2xl" />
            <div className="flex gap-4">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-20 h-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <HeroBannerSkeleton />

      {/* Categories Skeleton */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Products Skeleton */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'neutral';
}

export function LoadingSpinner({ size = 'md', color = 'primary' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    neutral: 'text-neutral-600'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}>
      <span className="material-symbols-outlined">progress_activity</span>
    </div>
  );
}