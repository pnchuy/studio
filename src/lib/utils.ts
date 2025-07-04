import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to get initials from a name
export const getInitials = (name: string = ""): string => {
  const names = name.split(' ').filter(Boolean);
  if (names.length === 0) return 'U'; // Default to 'U' for User
  const firstInitial = names[0][0];
  const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}


export function convertYoutubeUrlToEmbed(url: string | null | undefined): string {
    if (!url) {
        return '';
    }

    let videoId = '';
    
    // Standard youtube.com/watch?v=...
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) {
        videoId = match[1];
    } else {
        // Shortened youtu.be/...
        match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) {
            videoId = match[1];
        } else {
            // Already an embed link
             match = url.match(/embed\/([^?&]+)/);
             if (match) {
                videoId = match[1];
            }
        }
    }

    if (videoId) {
        // Return the embeddable URL
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // If no valid YouTube Video ID is found, return an empty string
    return '';
}
