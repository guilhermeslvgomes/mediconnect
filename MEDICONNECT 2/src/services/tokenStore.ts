// Centralized in-memory token store to avoid persistent storage of access tokens.
// Access token lives only in JS memory; refresh token kept in sessionStorage (lifetime = tab session).
// Legacy localStorage keys are read once (migration) then cleared.

interface TokenSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
  user: unknown | null;
}

class TokenStore {
  private accessToken: string | null = null;
  private userData: unknown | null = null;
  private readonly REFRESH_KEY = "refreshToken"; // sessionStorage
  private readonly LEGACY_ACCESS_KEYS = ["authToken", "token"];
  private readonly LEGACY_REFRESH_KEY = "refreshToken"; // localStorage legacy
  private readonly USER_KEY = "authUser"; // we no longer persist user automatically
  private migrated = false;

  private migrateLegacyStorage() {
    if (this.migrated) return;
    try {
      // Access token
      for (const k of this.LEGACY_ACCESS_KEYS) {
        const v = localStorage.getItem(k);
        if (v && !this.accessToken) {
          this.accessToken = v;
        }
      }
      // Refresh token from localStorage -> sessionStorage
      const legacyRefresh = localStorage.getItem(this.LEGACY_REFRESH_KEY);
      if (legacyRefresh && !sessionStorage.getItem(this.REFRESH_KEY)) {
        sessionStorage.setItem(this.REFRESH_KEY, legacyRefresh);
      }
      // Only clear legacy after migrating in-memory/sessionStorage
      for (const k of this.LEGACY_ACCESS_KEYS) localStorage.removeItem(k);
      localStorage.removeItem(this.LEGACY_REFRESH_KEY);

      // User data (optional)
      const userJson = localStorage.getItem(this.USER_KEY);
      if (userJson) {
        try {
          this.userData = JSON.parse(userJson);
        } catch {
          /* ignore */
        }
      }
      localStorage.removeItem(this.USER_KEY);
    } catch {
      // ignore storage errors
    } finally {
      this.migrated = true;
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.migrateLegacyStorage();
    this.accessToken = accessToken || null;
    if (refreshToken) {
      try {
        sessionStorage.setItem(this.REFRESH_KEY, refreshToken);
      } catch {
        /* ignore */
      }
    }
  }

  setUser(user: unknown) {
    this.userData = user;
  }

  getAccessToken(): string | null {
    this.migrateLegacyStorage();
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    this.migrateLegacyStorage();
    try {
      return sessionStorage.getItem(this.REFRESH_KEY);
    } catch {
      return null;
    }
  }

  getUser<T = unknown>(): T | null {
    return (this.userData as T) || null;
  }

  clear() {
    this.accessToken = null;
    this.userData = null;
    // Allow legacy migration to run again in fresh test contexts
    this.migrated = false;
    try {
      sessionStorage.removeItem(this.REFRESH_KEY);
    } catch {
      /* ignore */
    }
  }

  snapshot(): TokenSnapshot {
    return {
      accessToken: this.accessToken,
      refreshToken: this.getRefreshToken(),
      user: this.userData,
    };
  }
}

export const tokenStore = new TokenStore();
export default tokenStore;
