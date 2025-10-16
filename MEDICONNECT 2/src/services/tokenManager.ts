// TokenManager: obtém e renova token técnico usando grant_type=password
// Usado porque o login principal virá da plataforma LUMI, mas a API precisa de um bearer.

import {
  SUPABASE_URL,
  SERVICE_EMAIL,
  SERVICE_PASSWORD,
  serviceCredentialsConfigured,
} from "./supabaseConfig";
import { decodeJwt } from "./tokenDebug";

interface ServiceTokenState {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch seconds
}

let state: ServiceTokenState | null = null;
let externalToken: string | null = null; // token vindo da LUMI (prioritário se presente)
let fetchPromise: Promise<string | null> | null = null;
let refreshTimer: number | null = null;

// Removido uso de localStorage: tokens somente em memória.
function persist() {
  /* no-op: memória apenas */
}

function scheduleRefresh() {
  if (!state?.expires_at) return;
  const driftSec = 60; // renovar 60s antes
  const msUntil = state.expires_at * 1000 - Date.now() - driftSec * 1000;
  if (refreshTimer) window.clearTimeout(refreshTimer);
  if (msUntil <= 500) {
    void refresh();
    return;
  }
  refreshTimer = window.setTimeout(() => {
    void refresh();
  }, msUntil);
  console.info(
    "[TokenManager] Próximo refresh em",
    Math.round(msUntil / 1000),
    "s"
  );
}

async function fetchNewToken(): Promise<string | null> {
  if (!serviceCredentialsConfigured()) {
    console.warn(
      "[TokenManager] Credenciais de serviço ausentes. Configure VITE_SERVICE_EMAIL e VITE_SERVICE_PASSWORD."
    );
    return null;
  }
  try {
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: SERVICE_EMAIL,
        password: SERVICE_PASSWORD,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[TokenManager] Falha ao obter token", resp.status, txt);
      return null;
    }
    const data = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
    };
    const decoded = decodeJwt(data.access_token);
    state = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: decoded.payload?.exp,
    };
    persist();
    scheduleRefresh();
    console.info(
      "[TokenManager] Token técnico obtido. exp=",
      decoded.payload?.exp,
      "expired?",
      decoded.expired
    );
    return state.access_token;
  } catch (e) {
    console.error("[TokenManager] Erro inesperado ao obter token", e);
    return null;
  } finally {
    fetchPromise = null;
  }
}

export async function initServiceAuth(): Promise<void> {
  if (externalToken) return; // se token externo já foi injetado, não buscar técnico
  if (state?.access_token) {
    const decoded = decodeJwt(state.access_token);
    if (!decoded.expired) {
      scheduleRefresh();
      return;
    }
  }
  await ensureToken();
}

export function getAccessTokenSync(): string | null {
  return externalToken || state?.access_token || null;
}

export async function ensureToken(): Promise<string | null> {
  if (externalToken) return externalToken;
  if (state?.access_token) {
    const decoded = decodeJwt(state.access_token);
    if (!decoded.expired) return state.access_token;
  }
  if (!fetchPromise) fetchPromise = fetchNewToken();
  return fetchPromise;
}

async function refresh(): Promise<string | null> {
  // Supabase refresh com refresh_token requer POST /auth/v1/token com grant_type=refresh_token
  // Simplicidade: repetir password grant (menos eficiente, mas direto). Pode-se aprimorar depois.
  console.info("[TokenManager] Renovando token técnico...");
  return ensureToken();
}

export function setExternalToken(token: string | null) {
  externalToken = token;
  if (externalToken) {
    console.info(
      "[TokenManager] Token externo (LUMI) definido. Ignorando token técnico."
    );
  } else {
    console.info("[TokenManager] Token externo removido.");
  }
}

export function invalidateServiceToken(reason = "logout") {
  if (refreshTimer) {
    try {
      window.clearTimeout(refreshTimer);
    } catch {
      /* ignore */
    }
    refreshTimer = null;
  }
  state = null;
  if (!externalToken) {
    console.info("[TokenManager] Token técnico invalidado (" + reason + ").");
  } else {
    console.info(
      "[TokenManager] Token técnico invalidado mas token externo permanece."
    );
  }
}

declare global {
  interface Window {
    __setApiBearer?: (t: string | null) => void;
  }
}
if (typeof window !== "undefined") {
  window.__setApiBearer = (t: string | null) => {
    setExternalToken(t);
  };
}

export default {
  initServiceAuth,
  ensureToken,
  getAccessTokenSync,
  setExternalToken,
  invalidateServiceToken,
};
