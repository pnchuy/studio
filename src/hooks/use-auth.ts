
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, type User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, firebaseConfig } from '@/lib/firebase';
import type { User } from '@/types';
import { useToast } from './use-toast';
import { z } from 'zod';

const USER_STORAGE_KEY = 'bibliophile-user-auth-state';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  authProviderId: string | null;
  unverifiedUser: FirebaseUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credential: string, password: string) => Promise<{ success: boolean; message?: string; errorCode?: 'unverified' | 'invalid-credentials' | 'unknown' }>;
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
  const [unverifiedUser, setUnverifiedUser] = useState<FirebaseUser | null>(null);
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
        setFirebaseUser(fbUser);
        setAuthProviderId(fbUser.providerData?.[0]?.providerId || 'password');
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } else {
          // This handles the delay between creating a user in Auth and their doc appearing in Firestore.
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
          // Keep unverified user in a separate state, but ensure they are logged out.
          setUnverifiedUser(fbUser);
          if(auth.currentUser){
            await signOut(auth);
          }
        } else {
          // This block runs when fbUser is null (logged out).
          // We don't clear unverifiedUser here to allow the "Resend" dialog to persist.
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

  const login = useCallback(async (credential: string, password: string): Promise<{ success: boolean; message?: string; errorCode?: 'unverified' | 'invalid-credentials' | 'unknown' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured. Please provide Firebase credentials in your .env.local file.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg, errorCode: 'unknown' };
    }
    
    setUnverifiedUser(null); // Clear previous unverified state on new login attempt
    let emailToLogin = '';
    const isEmail = z.string().email().safeParse(credential).success;

    if (isEmail) {
      emailToLogin = credential;
    } else {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username", "==", credential.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return { success: false, message: "Thông tin không hợp lệ.", errorCode: 'invalid-credentials' };
        }
        
        const userData = querySnapshot.docs[0].data() as User;
        emailToLogin = userData.email;

      } catch (error) {
        console.error("Error fetching user by username:", error);
        return { success: false, message: "Đã xảy ra lỗi khi tìm kiếm người dùng.", errorCode: 'unknown' };
      }
    }
    
    if (!emailToLogin) {
      return { success: false, message: "Không thể xác định email để đăng nhập.", errorCode: 'unknown' };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      
      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        await signOut(auth); // Sign out immediately
        return { success: false, message: "Email chưa được xác minh. Vui lòng kiểm tra hộp thư của bạn.", errorCode: 'unverified' };
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
      setUnverifiedUser(null);
      return { success: false, message: "Thông tin không hợp lệ. Vui lòng kiểm tra lại email/username và mật khẩu.", errorCode: 'invalid-credentials' };
    }
  }, [router, toast]);

  const signup = useCallback(async (name: string, email: string, username: string, password: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' | 'password' }> => {
    if (!isFirebaseConfigured || !auth || !db) {
        const msg = "Firebase is not configured. Please provide Firebase credentials in your .env.local file.";
        toast({ variant: "destructive", title: "Firebase Not Configured", description: msg });
        return { success: false, message: msg};
    }
    
    // Temporarily disable username check
    // const usernameQuery = query(collection(db, "users"), where("username", "==", username.toLowerCase()), limit(1));
    // const usernameSnapshot = await getDocs(usernameQuery);
    // if (!usernameSnapshot.empty) {
    //     return { success: false, message: "This username is already taken.", field: 'username' };
    // }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      await sendEmailVerification(fbUser);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const firstUserCheckSnapshot = await getDocs(q);
      const isFirstUser = firstUserCheckSnapshot.empty;

      const newUser: User = {
        id: fbUser.uid,
        username: username,
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: isFirstUser ? 'ADMIN' : 'MEMBER',
      };
      
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      
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
    if(firebaseConfig.authDomain) {
      provider.setCustomParameters({
          'auth_domain': firebaseConfig.authDomain
      });
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
        
        const usernameQuery = query(collection(db, "users"), where("username", "==", username));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
          username = `${username}${Math.floor(Math.random() * 1000)}`;
        }

        userProfile = {
          id: fbUser.uid,
          username,
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
      console.error("Google sign-in error object:", error);
      
      let detailedMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return false;
      } else if(error.code === 'auth/unauthorized-domain') {
        detailedMessage = `Firebase: Error (${error.code}).. Please check the authorized domains in Firebase and Google Cloud console.`;
      } else if (error.customData && error.customData.message) {
        detailedMessage = error.customData.message;
      } else if (error.customData && error.customData._tokenResponse && error.customData._tokenResponse.error_description) {
        detailedMessage = error.customData._tokenResponse.error_description;
      } else if (error.message) {
        detailedMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Lỗi đăng nhập Google",
        description: detailedMessage,
        duration: 10000
      });
      return false;
    }
  }, [router, toast]);
  
  const resendVerificationEmail = useCallback(async () => {
    if (!unverifiedUser) {
        toast({ variant: "destructive", title: "Lỗi", description: "Không tìm thấy người dùng để gửi lại email." });
        return;
    }
    try {
        await sendEmailVerification(unverifiedUser);
        toast({ title: "Đã gửi!", description: "Một email xác minh mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn." });
        setUnverifiedUser(null);
    } catch (error) {
        console.error("Error resending verification email:", error);
        toast({ variant: "destructive", title: "Gửi lại thất bại", description: "Đã xảy ra lỗi. Vui lòng thử lại." });
    }
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
      authProviderId,
      unverifiedUser,
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
