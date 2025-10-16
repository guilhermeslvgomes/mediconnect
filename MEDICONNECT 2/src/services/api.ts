import axios, { type AxiosInstance } from "axios";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig";
import tokenStore from "./tokenStore";
import { logger } from "./logger";

// Config Supabase
// Permite sobrescrever via variáveis Vite (.env) mantendo fallback para a URL e chave fornecidas.
// Valores agora centralizados em supabaseConfig.ts

// Base principal (REST); os services já usam prefixo /rest/v1/
const api: AxiosInstance = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  },
});

// Incluir Authorization se existir token salvo
api.interceptors.request.use(
  async (config) => {
    try {
      config.headers = config.headers || {};
      const headers = config.headers as Record<string, string>;
      if (!headers.apikey) headers.apikey = SUPABASE_ANON_KEY;

      const lowered = (config.url || "").toLowerCase();
      const isAuthEndpoint =
        lowered.includes("/auth/v1/token") ||
        lowered.includes("/auth/v1/signup");

      const token = tokenStore.getAccessToken();
      if (token && !isAuthEndpoint) {
        // Validar se token não está expirado antes de enviar
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
              logger.warn("token expirado detectado - removendo authorization");
              tokenStore.clear();
              // Não adicionar Authorization com token expirado — API rejeita com "No API key found"
            } else {
              headers.Authorization = `Bearer ${token}`;
            }
          } else {
            headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          headers.Authorization = `Bearer ${token}`; // fallback se decode falhar
        }
      }
      // IMPORTANTE: Nunca usar anon key como Bearer token — API exige token de usuário válido ou ausente
      // Prefer header removido - causava erro CORS em /functions/v1/user-info
    } catch (e) {
      logger.warn("request interceptor error", {
        error: (e as Error)?.message,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para diagnosticar 401 e confirmar headers efetivos
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    try {
      const status = error?.response?.status;
      if (status === 401) {
        const cfg = error.config || {};
        const h = (cfg.headers || {}) as Record<string, string>;
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unauthorized";
        if (!h.apikey) {
          logger.error("401 missing apikey", { msg });
        } else if (!h.Authorization) {
          logger.warn("401 missing bearer token", { msg });
        }
      }
    } catch {
      /* ignore */
    }
    return Promise.reject(error);
  }
);

export default api;
