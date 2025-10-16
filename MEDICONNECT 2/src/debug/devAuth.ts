/*
 * Utilitário de desenvolvimento para injetar/inspecionar o token de acesso.
 * Uso no console do navegador após build/dev:
 *   window.__devAuth.setToken('SEU_TOKEN');
 *   window.__devAuth.clear();
 *   window.__devAuth.info();
 */

interface DevAuthAPI {
  setToken: (token: string) => void;
  clear: () => void;
  info: () => void;
}

interface DecodedJWT {
  exp?: number;
  email?: string;
  sub?: string;
  role?: string;
  [k: string]: unknown;
}

function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(payload)));
  } catch {
    return null;
  }
}

const api: DevAuthAPI = {
  setToken(token: string) {
    localStorage.setItem("authToken", token);
    const decoded = decodeJWT(token);
    console.info("[devAuth] Token salvo em localStorage.authToken");
    if (decoded) {
      const exp = decoded["exp"] as number | undefined;
      if (exp) {
        const diff = exp * 1000 - Date.now();
        console.info("[devAuth] expira em ~", Math.round(diff / 1000), "s");
      }
    }
  },
  clear() {
    localStorage.removeItem("authToken");
    console.info("[devAuth] authToken removido");
  },
  info() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("[devAuth] sem token armazenado");
      return;
    }
    const decoded = decodeJWT(token) || {};
    const info = {
      tokenPrefix: token.slice(0, 24) + "...",
      exp: decoded.exp,
      email: decoded.email,
      sub: decoded.sub,
      role: decoded.role,
    };
    console.table(info);
  },
};

// Anexa no objeto global para uso rápido
declare global {
  interface Window {
    __devAuth?: DevAuthAPI;
  }
}
if (typeof window !== "undefined") window.__devAuth = api;

export default api;
