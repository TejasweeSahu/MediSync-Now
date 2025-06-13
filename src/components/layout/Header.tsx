
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
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

export const Header: React.FC = () => {
  const { doctor, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show a toast message for logout failure
    } finally {
      setIsLogoutConfirmOpen(false);
    }
  };

  const handleLogoClickInHeader = () => {
    // Only trigger logout confirmation if authenticated, otherwise, it's a normal nav to home
    if (isAuthenticated) {
      setIsLogoutConfirmOpen(true);
    } else {
      router.push('/');
    }
  };

  const showDoctorInfoInHeader = isAuthenticated && doctor && pathname !== '/front-desk';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 flex h-16 items-center"> {/* Main flex container with horizontal padding */}
          {/* Left section for Logo */}
          <div className="flex items-center">
            <Logo 
              iconSize={24} 
              textSize="text-xl" 
              onLogoClick={isAuthenticated ? handleLogoClickInHeader : undefined} 
            />
          </div>

          {/* Spacer to push content to the right */}
          <div className="flex-grow"></div>

          {/* Right section for Doctor Info & Logout */}
          <div className="flex items-center">
            {showDoctorInfoInHeader && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle size={20} className="text-muted-foreground" />
                  <span className="font-medium">{doctor!.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from MediSync Now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
