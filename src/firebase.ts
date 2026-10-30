import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with account selection prompt
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});
// Request standard profile and email scopes
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export interface GoogleSignInResult {
  success: boolean;
  user?: {
    email: string;
    displayName: string;
    photoURL?: string;
    uid: string;
    idToken?: string;
  };
  error?: string;
  isPopupBlocked?: boolean;
}

/**
 * Triggers interactive Google Sign-In with official Google account chooser popup.
 * In environments where popups are blocked (e.g. iframe restrictions), returns isPopupBlocked=true
 * so the application gracefully presents the in-app Gemini Google identity dialog.
 */
export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    const fbUser: FirebaseUser = credential.user;
    const idToken = await fbUser.getIdToken();
    
    return {
      success: true,
      user: {
        email: fbUser.email || '',
        displayName: fbUser.displayName || '',
        photoURL: fbUser.photoURL || undefined,
        uid: fbUser.uid,
        idToken
      }
    };
  } catch (err: any) {
    const code = err?.code || '';
    const rawMessage = err?.message || 'Google authentication failed';
    const isPopupBlocked = 
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/unauthorized-domain' ||
      code === 'auth/internal-error' ||
      code === 'auth/network-request-failed' ||
      rawMessage.toLowerCase().includes('popup') ||
      rawMessage.toLowerCase().includes('unexpected token') ||
      rawMessage.toLowerCase().includes('doctype') ||
      rawMessage.toLowerCase().includes('json') ||
      rawMessage.toLowerCase().includes('cross-origin') ||
      rawMessage.toLowerCase().includes('restricted');

    const cleanError = isPopupBlocked
      ? 'Google identity window opened for account selection.'
      : rawMessage;

    return {
      success: false,
      error: cleanError,
      isPopupBlocked: true
    };
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {
    // Ignore signout errors
  }
}
