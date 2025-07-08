'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, type User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { User } from '@/types';
import { useToast } from './use-toast';
import { z } from 'zod';

const USER_STORAGE_KEY = 'bibliophile-user-auth-state';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credential: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  signup: (name: string, email: string, username: string, password: string) => Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }>;
  signInWithGoogle: () => Promise<boolean>;
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
      if (fbUser && fbUser.emailVerified) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } else {
          const creationTimestamp = new Date(fbUser.metadata.creationTime || 0).getTime();
          const now = new Date().getTime();

          if ((now - creationTimestamp) < 5000) { 
            await new Promise(resolve => setTimeout(resolve, 1500));
            const userDocAfterWait = await getDoc(userDocRef);

            if (userDocAfterWait.exists()) {
              const userData = userDocAfterWait.data() as User;
              setUser(userData);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            } else {
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
            console.warn("User exists in Auth but not in Firestore. Logging out.");
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
        if (fbUser && !fbUser.emailVerified) {
          // If a user object exists but email is not verified, ensure they are logged out.
          await signOut(auth);
        }
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = useCallback(async (credential: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured. Please provide Firebase credentials in your .env.local file.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg };
    }

    let emailToLogin = '';
    const isEmail = z.string().email().safeParse(credential).success;

    if (isEmail) {
      emailToLogin = credential;
    } else {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username_lowercase", "==", credential.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return { success: false, message: "Thông tin không hợp lệ. Vui lòng kiểm tra lại email/username và mật khẩu." };
        }
        
        const userData = querySnapshot.docs[0].data() as User;
        emailToLogin = userData.email;

      } catch (error) {
        console.error("Error fetching user by username:", error);
        return { success: false, message: "Đã xảy ra lỗi khi tìm kiếm người dùng." };
      }
    }
    
    if (!emailToLogin) {
      return { success: false, message: "Không thể xác định email để đăng nhập." };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth); // Sign out immediately
        return { success: false, message: "Email chưa được xác minh. Vui lòng kiểm tra hộp thư của bạn." };
      }

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
      return { success: true };
    } catch (error: any) {
      return { success: false, message: "Thông tin không hợp lệ. Vui lòng kiểm tra lại email/username và mật khẩu." };
    }
  }, [router, toast]);

  const signup = useCallback(async (name: string, email: string, username: string, password: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured. Please provide Firebase credentials in your .env.local file.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg};
    }
    
    const lowerCaseUsername = username.toLowerCase();
    const usernameQuery = query(collection(db, "users"), where("username_lowercase", "==", lowerCaseUsername), limit(1));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
        return { success: false, message: "This username is already taken.", field: 'username' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      await sendEmailVerification(fbUser);
      
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      const isFirstUser = allUsersSnapshot.empty;

      const newUser: User = {
        id: fbUser.uid,
        username,
        username_lowercase: lowerCaseUsername,
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      
      // Sign out immediately after registration to force email verification
      await signOut(auth);
      
      return { success: true };

    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            const msg = "Phương thức đăng ký chưa được kích hoạt trên Firebase.";
            toast({ variant: 'destructive', title: 'Đăng ký thất bại', description: msg });
            return { success: false, message: msg, field: 'email' };
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
  }, [toast]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth || !db) {
      toast({ variant: 'destructive', title: 'Firebase Not Configured', description: 'Please provide Firebase credentials in your .env.local file.' });
      return false;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userProfile: User;

      if (!userDoc.exists()) {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, limit(1));
        const snapshot = await getDocs(q);
        const isFirstUser = snapshot.empty;

        let username = fbUser.email?.split('@')[0] || `user${Date.now()}`;
        
        const usernameQuery = query(collection(db, "users"), where("username_lowercase", "==", username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
          username = `${username}${Math.floor(Math.random() * 1000)}`;
        }

        userProfile = {
          id: fbUser.uid,
          username,
          username_lowercase: username.toLowerCase(),
          name: fbUser.displayName || 'Google User',
          email: fbUser.email!,
          joinDate: new Date().toISOString().split('T')[0],
          role: isFirstUser ? 'ADMIN' : 'MEMBER',
        };
        await setDoc(userDocRef, userProfile);
      } else {
        userProfile = userDoc.data() as User;
      }

      const destination = (userProfile.role === 'ADMIN' || userProfile.role === 'MANAGER') ? '/admin' : '/';
      router.push(destination);
      return true;

    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return false;
      }
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      return false;
    }
  }, [router, toast]);

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
      signup,
      signInWithGoogle,
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
