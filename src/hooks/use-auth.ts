"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';
import { generateId } from '@/lib/utils';
import { useToast } from './use-toast';

const USER_STORAGE_KEY = 'bibliophile-user-auth-state';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, username: string, password: string) => Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // User is logged in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } else {
          // Profile doesn't exist, might be an issue. Log out for safety.
          console.error("User exists in Auth but not in Firestore. Logging out.");
          await signOut(auth);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
      const loggedInUser = userCredential.user;
       const userDocRef = doc(db, 'users', loggedInUser.uid);
       const userDoc = await getDoc(userDocRef);
       if(userDoc.exists()){
            const userData = userDoc.data() as User;
            if(userData.role === 'ADMIN' || userData.role === 'MANAGER'){
                router.push('/admin');
            } else {
                router.push('/');
            }
       } else {
         router.push('/');
       }
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      return false;
    }
  }, [router]);

  const signup = useCallback(async (name: string, email: string, username: string, password: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }> => {
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Step 2: Create user profile in Firestore
      const newUser: User = {
        id: fbUser.uid, // Use Firebase UID as the document ID
        username,
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: 'MEMBER',
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      
      // onAuthStateChanged will handle setting the user state and redirecting
      return { success: true };

    } catch (error: any) {
        console.error("Signup error:", error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: "An account with this email already exists.", field: 'email' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: "Password is too weak. Please use at least 6 characters.", field: 'password' };
        }
        return { success: false, message: "An unknown error occurred during sign up." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will clear user state
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log out at this time.",
      });
    }
  }, [router, toast]);

  const value = {
      user,
      firebaseUser,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      signup
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
