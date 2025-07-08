
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/types';
import { db, isFirebaseConfigured } from './firebase';

export async function getAllUsers(): Promise<User[]> {
  if (!isFirebaseConfigured || !db) {
    console.error("Firebase not configured. Returning empty user list.");
    return [];
  }
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    return userList;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getUserById(uid: string): Promise<User | null> {
    if (!isFirebaseConfigured || !db) {
        console.error("Firebase not configured. Cannot fetch user by ID.");
        return null;
    }
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
        return null;
    } catch(error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
}

export async function createUserProfile(uid: string, data: Omit<User, 'id'>): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.error("Firebase not configured. Cannot create user profile.");
        return;
    }
    try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, { ...data, id: uid });
    } catch (error) {
        console.error("Error creating user profile:", error);
    }
}

export async function updateUserRole(uid: string, role: User['role']): Promise<boolean> {
    if (!isFirebaseConfigured || !db) {
        console.error("Firebase not configured. Cannot update user role.");
        return false;
    }
    try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { role: role });
        return true;
    } catch (error) {
        console.error("Error updating user role:", error);
        return false;
    }
}
