
'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppStateProvider } from './AppStateContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <AppStateProvider>
        <TooltipProvider delayDuration={0}>
            {children}
        </TooltipProvider>
      </AppStateProvider>
    </AuthProvider>
  );
};
