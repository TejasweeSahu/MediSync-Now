
'use client';
import { useContext } from 'react';
import { AppStateContext } from '@/context/AppStateContext';

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
