
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
// SidebarTrigger is removed as there's no sidebar

export const Header: React.FC = () => {
  const { doctor, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Determine if doctor info and logout should be shown in the header
  // This logic remains, but considers that there's no sidebar context to hide it for front-desk
  // So, if a doctor is logged in, their info will show in header regardless of page (unless explicitly handled here)
  const showDoctorInfoInHeader = isAuthenticated && doctor;
  // If you want to hide doctor info on /front-desk even without a sidebar:
  // const showDoctorInfoInHeader = isAuthenticated && doctor && pathname !== '/front-desk';


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* SidebarTrigger removed */}
          <Logo iconSize={24} textSize="text-xl" /> {/* Ensure logo is always visible */}
        </div>
        
        {showDoctorInfoInHeader && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <UserCircle size={20} className="text-muted-foreground" />
              <span className="font-medium">{doctor!.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
