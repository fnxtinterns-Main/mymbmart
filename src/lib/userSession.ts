import { UserProfile } from './types';
import { initialUser } from './data';

/**
 * Deterministically generates a unique 6-digit referral code based on user identifier (email, phone, or id).
 * Guarantees that the same user always gets the exact same code, while different users get distinct codes.
 */
export function getDeterministicReferralCode(seed: string): string {
  if (!seed || !seed.trim()) return '';
  const clean = seed.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) + hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = (Math.abs(hash) % 900000) + 100000;
  return `MBM${codeNum}`;
}

/**
 * Deterministically generates a unique 6-digit Member ID.
 */
export function getDeterministicMemberId(seed: string): string {
  if (!seed || !seed.trim()) return 'Guest Member';
  const clean = 'mem_' + seed.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) + hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = (Math.abs(hash) % 900000) + 100000;
  return `MBM${codeNum}`;
}

/**
 * Reads user session safely from browser cookies or localStorage.
 */
export function getStoredUserSession(): { user: UserProfile | null; isLoggedIn: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, isLoggedIn: false };
  }

  try {
    // 1. Try reading mbm_user_data cookie (set by auth endpoints)
    const cookies = document.cookie.split('; ');
    const userCookie = cookies.find((row) => row.startsWith('mbm_user_data='));
    if (userCookie) {
      try {
        const raw = userCookie.split('=')[1];
        const parsed = JSON.parse(decodeURIComponent(raw));
        if (parsed && (parsed.email || parsed.phone || parsed.name)) {
          const user = hydrateUserProfile(parsed);
          // Sync to localStorage
          try {
            localStorage.setItem('mbm_user', JSON.stringify(user));
          } catch {}
          return { user, isLoggedIn: true };
        }
      } catch {}
    }

    // 2. Try reading localStorage mbm_user
    const saved = localStorage.getItem('mbm_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.email || parsed.phone || parsed.name)) {
        const user = hydrateUserProfile(parsed);
        return { user, isLoggedIn: true };
      }
    }
  } catch (err) {
    console.warn('Session retrieval error:', err);
  }

  return { user: null, isLoggedIn: false };
}

/**
 * Ensures user profile has a valid unique referralCode and memberId.
 */
export function hydrateUserProfile(raw: any): UserProfile {
  const seed = raw.email || raw.phone || raw.id || raw.name || 'user';
  const referralCode =
    raw.referralCode && raw.referralCode !== 'MBM2026'
      ? raw.referralCode
      : getDeterministicReferralCode(seed);

  const memberId =
    raw.memberId && raw.memberId !== 'Guest Member'
      ? raw.memberId
      : getDeterministicMemberId(seed);

  return {
    ...initialUser,
    ...raw,
    memberId,
    referralCode,
    name: raw.name || (raw.email ? raw.email.split('@')[0] : 'Member'),
    email: raw.email || '',
    phone: raw.phone || '',
    level: raw.level || 'Silver',
    role: raw.role || 'CONSUMER',
    isActive: true,
  };
}

/**
 * Saves user session to both localStorage and cookie.
 */
export function saveUserSession(profile: Partial<UserProfile>): void {
  if (typeof window === 'undefined') return;
  try {
    const hydrated = hydrateUserProfile(profile);
    localStorage.setItem('mbm_user', JSON.stringify(hydrated));
    document.cookie = `mbm_user_data=${encodeURIComponent(
      JSON.stringify(hydrated)
    )}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Clears user session from localStorage and cookies.
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('mbm_user');
    localStorage.removeItem('mbm_token');
    document.cookie = 'mbm_user_data=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'mbm_session=; path=/; max-age=0; SameSite=Lax';
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}
