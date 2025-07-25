// This file is no longer used for cover images, but could be useful for other file uploads in the future.
// The logic has been moved to the Add/Edit book form components to handle Base64 encoding.

import { ref, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';


/**
 * Deletes a cover image from Firebase Storage.
 * @param bookId The ID of the book whose cover needs to be deleted.
 */
export async function deleteCoverImage(bookId: string): Promise<void> {
    if (!isFirebaseConfigured || !storage) return;

    const storageRef = ref(storage, `covers/${bookId}.webp`);

    try {
        await deleteObject(storageRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            // It's okay if the object doesn't exist, maybe it was never uploaded or already deleted.
            console.log(`Image for book ${bookId} not found, skipping deletion.`);
        } else {
            console.error("Error deleting image from Firebase Storage:", error);
        }
    }
}
