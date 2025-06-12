
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/shared/Logo';
import { Skeleton } from '@/components/ui/skeleton';


export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
      <Logo iconSize={48} textSize="text-4xl" />
      <div className="mt-4 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <p className="text-muted-foreground mt-2">Loading MediSync Now...</p>
    </div>
  );
}
