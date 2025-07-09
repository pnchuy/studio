import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

/**
 * Uploads a Base64 data URL to Firebase Storage and returns the public URL.
 * @param base64DataUrl The 'data:image/...' string.
 * @param bookId The unique ID of the book, used as the image file name.
 * @returns The public URL of the uploaded image.
 */
export async function uploadCoverImage(
  base64DataUrl: string,
  bookId: string
): Promise<string> {
  if (!isFirebaseConfigured || !storage || !base64DataUrl.startsWith('data:image')) {
    // If firebase isn't configured or it's not a data URL, return it as is (might be a placeholder or existing URL)
    return base64DataUrl;
  }

  const storageRef = ref(storage, `covers/${bookId}.webp`);

  // Extract the Base64 part of the data URL
  const base64String = base64DataUrl.split(',')[1];

  try {
    // Upload the new image
    await uploadString(storageRef, base64String, 'base64', {
      contentType: 'image/webp',
    });

    // Get the public URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    // Fallback to a placeholder if upload fails
    return "https://placehold.co/400x600.png";
  }
}

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
