import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '@/types';
import { db } from './firebase'; // Make sure db is exported from firebase.ts

export async function getAllUsers(): Promise<User[]> {
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
    try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, { ...data, id: uid });
    } catch (error) {
        console.error("Error creating user profile:", error);
    }
}
