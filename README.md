# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firebase CLI Configuration

Before deploying, ensure your Firebase CLI is pointing to the correct project.

1.  **Check current project:** `firebase use`
2.  **Switch to the correct project:** `firebase use list-read`
3.  **Deploy Firestore rules:** `firebase deploy --only firestore:rules`

This ensures that any changes to `firestore.rules` are applied to the correct production environment.
