
'use client';
import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from './Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Removed Button import as it's no longer used for an extra button in the dialog

// Helper to determine if a route is protected
const PROTECTED_ROUTES_PREFIX = ['/dashboard'];

const isProtectedRoute = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return PROTECTED_ROUTES_PREFIX.some(prefix => pathname.startsWith(prefix));
};

const isSafePublicRoute = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname === '/' || pathname === '/login' || pathname === '/front-desk';
}

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const currentPathname = usePathname(); 
  const previousPathnameRef = useRef<string | null>(currentPathname);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [logoutTrigger, setLogoutTrigger] = useState<'header' | 'back_navigation'>('header');
  const [intendedNavigationPath, setIntendedNavigationPath] = useState<string | null>(null);

  useEffect(() => {
    previousPathnameRef.current = currentPathname;
  }, [currentPathname]);

  useEffect(() => {
    const handlePopState = () => {
      const newPathname = window.location.pathname; 

      if (
        isAuthenticated &&
        isProtectedRoute(previousPathnameRef.current) && 
        !isProtectedRoute(newPathname) && 
        isSafePublicRoute(newPathname) 
      ) {
        setLogoutTrigger('back_navigation');
        setIntendedNavigationPath(newPathname); 
        setIsLogoutConfirmOpen(true);
        
        if (previousPathnameRef.current) {
          router.push(previousPathnameRef.current, { scroll: false });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]); 

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutConfirmOpen(false);
    if (logoutTrigger === 'back_navigation' && intendedNavigationPath) {
      router.push(intendedNavigationPath); 
    } else {
      router.push('/login'); 
    }
  };

  const handleCancelLogoutDialog = () => {
    setIsLogoutConfirmOpen(false);
  };
  
  // handleLeaveWithoutLoggingOut is no longer needed.

  const openHeaderLogoutConfirm = () => {
    setLogoutTrigger('header');
    setIntendedNavigationPath('/login'); 
    setIsLogoutConfirmOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        showLogoutConfirm={openHeaderLogoutConfirm}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {logoutTrigger === 'back_navigation'
                ? "You are navigating away. Do you want to log out?"
                : "Are you sure you want to logout?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLogoutDialog}>Cancel</AlertDialogCancel>
            {/* The "Leave Without Logging Out" button is removed */}
            <AlertDialogAction onClick={handleConfirmLogout}>
              Logout {/* Standardized button text */}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
