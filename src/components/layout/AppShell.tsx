
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
import { Button } from '@/components/ui/button';

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
  const currentPathname = usePathname(); // Current actual path from Next.js router
  const previousPathnameRef = useRef<string | null>(currentPathname);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [logoutTrigger, setLogoutTrigger] = useState<'header' | 'back_navigation'>('header');
  const [intendedNavigationPath, setIntendedNavigationPath] = useState<string | null>(null);

  // Update previousPathnameRef whenever currentPathname changes
  useEffect(() => {
    previousPathnameRef.current = currentPathname;
  }, [currentPathname]);

  useEffect(() => {
    const handlePopState = () => {
      const newPathname = window.location.pathname; // Path after popstate event

      if (
        isAuthenticated &&
        isProtectedRoute(previousPathnameRef.current) && // Was on a protected route
        !isProtectedRoute(newPathname) && // Navigating to a non-protected route
        isSafePublicRoute(newPathname) // Specifically one we expect when logging out/going home
      ) {
        setLogoutTrigger('back_navigation');
        setIntendedNavigationPath(newPathname); // Store where the browser tried to go
        setIsLogoutConfirmOpen(true);
        
        // IMPORTANT: Prevent the back navigation from completing visually by pushing
        // the user back to the page they were on.
        // This needs to be done carefully.
        if (previousPathnameRef.current) {
          router.push(previousPathnameRef.current, { scroll: false });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, router, logout]); // currentPathname change is handled by previousPathnameRef update

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutConfirmOpen(false);
    if (logoutTrigger === 'back_navigation' && intendedNavigationPath) {
      router.push(intendedNavigationPath); // Go to the page they originally intended via back button
    } else {
      router.push('/login'); // Default for header-triggered logout
    }
  };

  const handleCancelLogoutDialog = () => {
    setIsLogoutConfirmOpen(false);
    // If triggered by 'back_navigation', the router.push in handlePopState already
    // kept them on the previous page. So, "Cancel" means they stay there.
  };
  
  const handleLeaveWithoutLoggingOut = () => {
    setIsLogoutConfirmOpen(false);
    if (logoutTrigger === 'back_navigation' && intendedNavigationPath) {
      // Allow the original back navigation to proceed.
      // Use replace to avoid adding another entry for the "paused" page to history.
      router.replace(intendedNavigationPath);
    }
  };

  const openHeaderLogoutConfirm = () => {
    setLogoutTrigger('header');
    // For header logout, intended path after logout is usually /login
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
            {logoutTrigger === 'back_navigation' && (
                 <Button variant="outline" onClick={handleLeaveWithoutLoggingOut}>
                    Leave Without Logging Out
                 </Button>
            )}
            <AlertDialogAction onClick={handleConfirmLogout}>
              {logoutTrigger === 'back_navigation' ? 'Logout & Leave' : 'Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
