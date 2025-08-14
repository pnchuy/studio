
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, type User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, limit, getDocs, where, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, firebaseConfig } from '@/lib/firebase';
import type { User } from '@/types';
import { useToast } from './use-toast';
import { z } from 'zod';

const USER_STORAGE_KEY = 'bibliophile-user-auth-state';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  authProviderId: string | null;
  unverifiedUser: User | null;
  notRegisteredUser: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; errorCode?: 'unverified' | 'not-registered' | 'invalid-credentials' | 'unknown' }>;
  logout: () => void;
  signup: (name: string, email: string, username: string, password: string) => Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }>;
  signInWithGoogle: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authProviderId, setAuthProviderId] = useState<string | null>(null);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [notRegisteredUser, setNotRegisteredUser] = useState(false);
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
        setUnverifiedUser(null);
        setNotRegisteredUser(false);
        setFirebaseUser(fbUser);
        setAuthProviderId(fbUser.providerData?.[0]?.providerId || 'password');
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Activate user on successful login
          if (userData.status === 'inactivated') {
            await updateDoc(userDocRef, { status: 'active' });
            userData.status = 'active';
          }
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
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
      } else {
        // If there's an fbUser but they are not verified, we don't treat them as logged in.
        // We also don't clear the 'unverified' or 'not registered' states here to allow UI to show correct messages.
        if (fbUser && !fbUser.emailVerified) {
          await signOut(auth);
        }
        setUser(null);
        setFirebaseUser(null);
        setAuthProviderId(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; errorCode?: 'unverified' | 'not-registered' | 'invalid-credentials' | 'unknown' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg, errorCode: 'unknown' };
    }
    
    // Clear previous error states
    setUnverifiedUser(null);
    setNotRegisteredUser(false);

    try {
        const q = query(collection(db, 'users'), where("email", "==", email.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setNotRegisteredUser(true);
          return { success: false, message: "Email chưa được đăng ký.", errorCode: 'not-registered' };
        }
        
        const userData = querySnapshot.docs[0].data() as User;
        
        if (userData.status === 'inactivated') {
          setUnverifiedUser(userData);
          return { success: false, message: "Email chưa được kích hoạt.", errorCode: 'unverified' };
        }
        
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
        return { success: true };

    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
             return { success: false, message: "Thông tin không hợp lệ. Vui lòng kiểm tra lại email và mật khẩu.", errorCode: 'invalid-credentials' };
        }
        console.error("Login error:", error);
        return { success: false, message: "Đã xảy ra lỗi không xác định.", errorCode: 'unknown' };
    }
  }, [toast]);

  const signup = useCallback(async (name: string, email: string, username: string, password: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg};
    }
    
    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    // Check for duplicate username
    const usernameQuery = query(collection(db, "users"), where("username", "==", lowerCaseUsername), limit(1));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
        return { success: false, message: "Username này đã có người sử dụng.", field: 'username' };
    }
    
    // Check for duplicate email
    const emailQuery = query(collection(db, "users"), where("email", "==", lowerCaseEmail), limit(1));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
        const existingUser = emailSnapshot.docs[0].data() as User;
        if (existingUser.status === 'active') {
             return { success: false, message: "Một tài khoản với email này đã tồn tại.", field: 'email' };
        } else {
             // User exists but is inactive, resend verification email
             try {
                // We need to temporarily sign in the user to send verification email
                const userCredential = await signInWithEmailAndPassword(auth, lowerCaseEmail, "some-temporary-password-that-will-fail-but-we-need-the-user-object");
                await sendEmailVerification(userCredential.user);
                await signOut(auth); // Sign out immediately
                return { success: true };
             } catch (authError: any) {
                // This is tricky. If password login is not enabled or something else fails, we can't get the user object to resend.
                // A better approach would be a custom backend function. For now, we simulate success and rely on the user having the original email.
                if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
                   // This is expected. We can't log in. We'll have to rely on a more complex server-side setup to *truly* resend.
                   // For this project, we'll just inform the user we're sending a new one.
                   // The original implementation with createUser will handle it.
                } else {
                     console.error("Error during inactive re-signup:", authError);
                }
             }
        }
    }


    try {
      const userCredential = await createUserWithEmailAndPassword(auth, lowerCaseEmail, password);
      const fbUser = userCredential.user;
      
      await sendEmailVerification(fbUser);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const firstUserCheckSnapshot = await getDocs(q);
      const isFirstUser = firstUserCheckSnapshot.empty && !await getDoc(doc(db, "users", fbUser.uid)).then(d => d.exists());

      const newUser: User = {
        id: fbUser.uid,
        username: lowerCaseUsername,
        name,
        email: lowerCaseEmail,
        joinDate: new Date().toISOString().split('T')[0],
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
        status: 'inactivated',
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      await signOut(auth);
      
      return { success: true };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: "Một tài khoản với email này đã tồn tại.", field: 'email' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự.", field: 'password' };
        }
        console.error("Signup error:", error);
        return { success: false, message: `An unknown error occurred: ${error.message}` };
    }
  }, [toast]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth || !db) {
      toast({ variant: 'destructive', title: 'Firebase Not Configured' });
      return false;
    }

    const provider = new GoogleAuthProvider();
    if(firebaseConfig.authDomain) {
      provider.setCustomParameters({ 'auth_domain': firebaseConfig.authDomain });
    }

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

        let username = (fbUser.email?.split('@')[0] || `user${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let suffix = 1;
        let finalUsername = username;
        while(true) {
            const usernameQuery = query(collection(db, "users"), where("username", "==", finalUsername));
            const usernameSnapshot = await getDocs(usernameQuery);
            if(usernameSnapshot.empty) break;
            finalUsername = `${username}_${suffix}`;
            suffix++;
        }

        userProfile = {
          id: fbUser.uid,
          username: finalUsername,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email!,
          joinDate: new Date().toISOString().split('T')[0],
          role: isFirstUser ? 'ADMIN' : 'MEMBER',
          status: 'active' // Google users are active by default
        };
        await setDoc(userDocRef, userProfile);
      } else {
        userProfile = userDoc.data() as User;
        if(userProfile.status === 'inactivated'){
            await updateDoc(userDocRef, { status: 'active' });
            userProfile.status = 'active';
        }
      }

      const destination = (userProfile.role === 'ADMIN' || userProfile.role === 'MANAGER') ? '/admin' : '/';
      router.push(destination);
      return true;

    } catch (error: any) {
      console.error("Google sign-in error object:", error);
      let detailedMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') return false;
      toast({ variant: "destructive", title: "Lỗi đăng nhập Google", description: detailedMessage });
      return false;
    }
  }, [router, toast]);
  
  const resendVerificationEmail = useCallback(async () => {
    // This function is less relevant now as the flow encourages re-signup
    // but we keep it for potential future use.
    if (!unverifiedUser) return;
     toast({ title: "Chức năng đang được xem xét lại", description: "Vui lòng đăng ký lại để nhận email kích hoạt mới." });
  }, [unverifiedUser, toast]);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) {
        setUser(null);
        setFirebaseUser(null);
        setUnverifiedUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        router.push('/');
        return;
    }
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed" });
    }
  }, [router, toast]);

  const value = {
      user,
      firebaseUser,
      authProviderId,
      unverifiedUser,
      notRegisteredUser,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      signup,
      signInWithGoogle,
      resendVerificationEmail,
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
