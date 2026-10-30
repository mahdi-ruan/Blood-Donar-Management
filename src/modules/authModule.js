/**
 * ============================================================================
 * MODULE 1: Authentication & Role Management Module
 * ============================================================================
 * - Regular users/donors authenticate exclusively via Google Sign-In (Firebase)
 * - System Administrator authenticates using one fixed credential pair
 */
import { firebaseAdapter } from '../services/firebaseConfig.js';

export const ADMIN_CREDENTIALS = {
  email: 'admin@bloodlink.com',
  password: 'Admin@123',
  name: 'Chief Medical Admin',
  role: 'admin'
};

export class AuthModule {
  constructor(authProvider = firebaseAdapter) {
    this.authProvider = authProvider;
    this.sessionKey = 'bloodlink_active_user';
  }

  getCurrentUser() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(this.sessionKey);
        return stored ? JSON.parse(stored) : null;
      }
    } catch {
      return null;
    }
    return null;
  }

  #persistSession(userObj) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (userObj) {
          window.localStorage.setItem(this.sessionKey, JSON.stringify(userObj));
        } else {
          window.localStorage.removeItem(this.sessionKey);
        }
      }
    } catch {
      // Ignore storage errors in headless environments
    }
  }

  async loginWithGoogle(customGoogleProfile = null) {
    const googleUser = await this.authProvider.signInWithGooglePopup(customGoogleProfile);
    const sessionUser = {
      uid: googleUser.uid,
      name: googleUser.name,
      email: googleUser.email,
      photoURL: googleUser.photoURL,
      role: 'user',
      authMethod: 'Google OAuth (Firebase)'
    };
    this.#persistSession(sessionUser);
    return sessionUser;
  }

  loginAsAdmin(email, password) {
    if (!email || !password) {
      throw new Error('Admin email and password are required');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const adminUser = {
        uid: 'admin-fixed-01',
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: 'admin',
        authMethod: 'Fixed Admin Credentials'
      };
      this.#persistSession(adminUser);
      return adminUser;
    }
    throw new Error('Invalid Admin credentials. Access denied.');
  }

  async logout() {
    await this.authProvider.signOutUser();
    this.#persistSession(null);
    return true;
  }
}

