
'use client';

import type { Doctor } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { mockDoctors } from '@/data/mockData'; // We'll use this to find doctor details by email

interface AuthContextType {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mapFirebaseUserToDoctor = useCallback((user: FirebaseUser | null): Doctor | null => {
    if (!user || !user.email) {
      return null;
    }
    // Find the doctor profile from mock data based on the Firebase user's email
    // In a real app, you'd fetch this from a 'doctors' collection in Firestore using user.uid
    const matchedDoctor = mockDoctors.find(d => d.email.toLowerCase() === user.email!.toLowerCase());
    return matchedDoctor || null;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        const currentDoctor = mapFirebaseUserToDoctor(user);
        setDoctor(currentDoctor);
        setIsAuthenticated(true);
      } else {
        setFirebaseUser(null);
        setDoctor(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [mapFirebaseUserToDoctor]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and doctor state
    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw for the form to handle
    }
    // setLoading will be set to false by onAuthStateChanged
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle clearing user and doctor state
    } catch (error) {
      setIsLoading(false);
      console.error("Error signing out: ", error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error; // Re-throw for the form to handle
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, doctor, firebaseUser, login, logout, sendPasswordReset, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
