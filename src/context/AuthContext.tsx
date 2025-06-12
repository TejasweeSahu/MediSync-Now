
'use client';

import type { Doctor } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { defaultDoctor } from '@/data/mockData';

interface AuthContextType {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  login: (doctorId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'medisync_auth_doctor_id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedDoctorId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedDoctorId) {
        // In a real app, you'd fetch doctor details based on ID
        // For simulation, we'll use the defaultDoctor if ID matches, or a generic one
        if (storedDoctorId === defaultDoctor.id) {
          setDoctor(defaultDoctor);
          setIsAuthenticated(true);
        } else {
          // Handle case where stored ID might not match any mock doctor
          // For now, let's assume it's the default doctor for simplicity of simulation
          setDoctor(defaultDoctor);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      // Fallback or error handling if localStorage is not available
    }
    setIsLoading(false);
  }, []);

  const login = (doctorId: string) => {
    // Simulate login - in real app, this would involve API call
    // For now, we'll use the defaultDoctor if ID matches
    if (doctorId === defaultDoctor.id) {
      setDoctor(defaultDoctor);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, doctorId);
      } catch (error) {
         console.error("Failed to access localStorage:", error);
      }
    } else {
      // Handle other doctors if necessary or show error
      console.warn(`Login attempt for unknown doctor ID: ${doctorId}. Simulating with default doctor.`);
      setDoctor(defaultDoctor); // Fallback to default for simulation
      setIsAuthenticated(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, defaultDoctor.id);
      } catch (error) {
        console.error("Failed to access localStorage:", error);
      }
    }
  };

  const logout = () => {
    setDoctor(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  };
  
  if (isLoading && typeof window === 'undefined') {
    return null; // Avoid rendering anything on the server during initial load if dependent on localStorage
  }


  return (
    <AuthContext.Provider value={{ isAuthenticated, doctor, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
