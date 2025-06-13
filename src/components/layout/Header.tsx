
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import type { LogoProps } from '@/components/shared/Logo'; // Ensure LogoProps is exported and imported

// Remove AlertDialog imports from here as it's now in AppShell
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

interface HeaderProps {
  showLogoutConfirm: () => void; // Callback from AppShell to show dialog
}

export const Header: React.FC<HeaderProps> = ({ showLogoutConfirm }) => {
  const { doctor, isAuthenticated } = useAuth(); // Removed logout, as it's handled in AppShell
  const router = useRouter();
  const pathname = usePathname();
  // Removed isLogoutConfirmOpen state, as it's managed by AppShell

  const handleLogoutButtonClick = () => {
    showLogoutConfirm(); // Trigger dialog via AppShell
  };

  // const handleConfirmLogout = async () => { // Logic moved to AppShell
  // };

  const handleLogoClickForSharedLogo: LogoProps['onLogoClick'] = (event) => {
    if (isAuthenticated) {
      if (event) event.preventDefault(); // Prevent default Link behavior
      showLogoutConfirm(); // Trigger dialog via AppShell
    }
    // If not authenticated, Logo's default Link behavior (href="/") will handle navigation
    // No explicit router.push('/') here, as Logo component handles it
  };

  const showDoctorInfoInHeader = isAuthenticated && doctor && pathname !== '/front-desk';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 flex h-16 items-center">
          <div className="flex items-center">
            <Logo 
              iconSize={24} 
              textSize="text-xl" 
              onLogoClick={isAuthenticated ? handleLogoClickForSharedLogo : undefined} 
            />
          </div>

          <div className="flex-grow"></div>

          <div className="flex items-center">
            {showDoctorInfoInHeader && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle size={20} className="text-muted-foreground" />
                  <span className="font-medium">{doctor!.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogoutButtonClick}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AlertDialog removed from here, now managed by AppShell */}
    </>
  );
};
