'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { User } from '@/types';
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
    if (!isFirebaseConfigured || !auth || !db) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } else {
          // Profile doesn't exist, might be a race condition on signup.
          // Let's check if this is a very new user.
          const creationTimestamp = new Date(fbUser.metadata.creationTime || 0).getTime();
          const now = new Date().getTime();

          if ((now - creationTimestamp) < 5000) { // If created in the last 5 seconds
            // It's likely a new user, let's wait a moment for the Firestore doc to be created.
            await new Promise(resolve => setTimeout(resolve, 1500));
            const userDocAfterWait = await getDoc(userDocRef);

            if (userDocAfterWait.exists()) {
              const userData = userDocAfterWait.data() as User;
              setUser(userData);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            } else {
              // Still no document, something is wrong.
              console.warn("User document not found even after signup delay. Logging out.");
              toast({
                variant: "destructive",
                title: "Registration Incomplete",
                description: "Your user profile could not be saved. You have been logged out. Please try signing up again.",
              });
              await signOut(auth);
              setUser(null);
            }
          } else {
            // It's an old user whose document is missing, which is a problem.
            console.warn("User profile not found in database. Logging out for safety.");
            toast({
                variant: 'destructive',
                title: 'Profile Not Found',
                description: 'Your user profile is missing from the database. You have been logged out.',
            });
            await signOut(auth);
            setUser(null);
          }
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
  }, [toast]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth || !db) {
        toast({ variant: "destructive", title: "Firebase Not Configured", description: "Please provide Firebase credentials in the .env file." });
        return false;
    }
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
      // A failed login attempt is an expected behavior, not an application error.
      // The UI will show a toast notification to the user.
      // We don't need to log this to the console.
      return false;
    }
  }, [router, toast]);

  const signup = useCallback(async (name: string, email: string, username: string, password: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        toast({ variant: "destructive", title: "Firebase Not Configured", description: "Please provide Firebase credentials in the .env file." });
        return { success: false, message: 'Firebase not configured.'};
    }
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      // Step 2: Determine user role. First user is ADMIN.
      const usersCollectionRef = collection(db, 'users');
      const firstUserQuery = query(usersCollectionRef, limit(1));
      const querySnapshot = await getDocs(firstUserQuery);
      const isFirstUser = querySnapshot.empty;

      // Step 3: Create user profile in Firestore
      const newUser: User = {
        id: fbUser.uid, // Use Firebase UID as the document ID
        username,
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      
      // onAuthStateChanged will handle setting the user state and redirecting
      router.push('/');
      return { success: true };

    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            toast({ variant: 'destructive', title: 'Đăng ký thất bại', description: "Phương thức đăng ký chưa được kích hoạt trên Firebase." });
            return { success: false, message: "Phương thức đăng ký chưa được kích hoạt trên Firebase.", field: 'email' };
        }
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: "An account with this email already exists.", field: 'email' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: "Password must be at least 6 characters.", field: 'password' };
        }
        console.error("Signup error:", error);
        return { success: false, message: `An unknown error occurred: ${error.message}` };
    }
  }, [toast, router]);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) {
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        router.push('/');
        return;
    }
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
