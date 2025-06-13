
'use client';
import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'; // Keep for potential future use or if Header needs it
import { useAuth } from '@/hooks/useAuth';
import { Header } from './Header';

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated }
 = useAuth(); // Keep for potential Header logic or direct child needs
  const router = useRouter();
  const pathname = usePathname();

  // Logout functionality is now primarily in the Header
  // NavItems are removed as sidebar is gone

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
