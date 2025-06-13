
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';

export const Header: React.FC = () => {
  const { doctor, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const showDoctorInfoInHeader = isAuthenticated && doctor && pathname !== '/front-desk';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center"> {/* Main flex container */}
        {/* Left section for Logo */}
        <div className="flex items-center">
          <Logo iconSize={24} textSize="text-xl" />
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
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
