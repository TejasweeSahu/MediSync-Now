
'use client';
import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from './Header';
import { Logo } from '@/components/shared/Logo';
import { LayoutDashboard, Mic, LogOut } from 'lucide-react'; // Removed Users, not used after simplification
import { Button } from '../ui/button';
// import { Skeleton } from '../ui/skeleton'; // Removed Skeleton import

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/front-desk', label: 'Front Desk', icon: Mic },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, logout, doctor } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Simplified loading state */}
          <p className="text-2xl font-bold text-primary">MediSync Now</p>
          <p className="text-muted-foreground">Loading application...</p>
          <div role="status" className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-md mb-2"></div>
            <div className="h-8 w-32 bg-muted rounded-md"></div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar Scollapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
           <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
             <LogOut /> 
             <span>Logout</span>
           </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
