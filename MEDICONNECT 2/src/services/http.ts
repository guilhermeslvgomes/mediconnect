import api from "./api";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { decodeJwt } from "./tokenDebug";
import authService from "./authService";
import tokenStore from "./tokenStore";
import { logger } from "./logger";
import { AUTH_SECURITY_CONFIG } from "./authConfig";

// Tipo de resposta padrão reutilizado em todos os services
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HttpErrorPayload {
  status?: number;
  message: string;
  code?: string;
  details?: unknown;
}

export function parseError(err: unknown): HttpErrorPayload {
  if (typeof err === "string") return { message: err };
  const axiosErr = err as AxiosError<unknown>;
  const status = axiosErr?.response?.status;
  const data = (axiosErr?.response?.data as Record<string, unknown>) || {};

  // Supabase pode retornar erro em diferentes formatos
  const msg =
    (data["message"] as string) ||
    (data["msg"] as string) ||
    (data["error_description"] as string) ||
    (data["error"] as string) ||
    (data["hint"] as string) ||
    axiosErr.message ||
    "Erro desconhecido";

  // Adicionar detalhes do Supabase se disponível
  const hint = data["hint"] as string | undefined;
  const detail = data["details"] as string | undefined;
  const finalMsg = hint
    ? `${msg} (${hint})`
    : detail
    ? `${msg} (${detail})`
    : msg;

  console.error("[HTTP] Erro capturado:", {
    status,
    message: finalMsg,
    code: data["code"],
    details: data,
  });

  return {
    status,
    message: finalMsg,
    code: data["code"] as string | undefined,
    details: data,
  };
}

function buildErrorResponse<T = never>(
  err: unknown,
  fallback: string
): ApiResponse<T> {
  const e = parseError(err);
  if (e.status === 401) {
    try {
      const token = tokenStore.getAccessToken();
      const decoded = decodeJwt(token);
      const tokenInfo = decoded.valid
        ? { exp: decoded.payload?.exp, expired: decoded.expired }
        : { valid: false };
      consecutive401 += 1;
      logger.warn("401 response", { ...tokenInfo, count: consecutive401 });
      if (consecutive401 >= MAX_401_BEFORE_FORCED_LOGOUT) {
        logger.error("atingido limite de 401 consecutivos - forçando logout");
        tokenStore.clear();
      }
    } catch {
      /* ignore logging failure */
    }
  }
  return { success: false, error: e.message || fallback };
}

// Wrapper genérico simplificado
async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return execWithRetry<T>(
    "get",
    url,
    undefined,
    config,
    "Erro ao buscar dados"
  );
}
async function httpPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return execWithRetry<T>("post", url, body, config, "Erro ao criar");
}
async function httpPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return execWithRetry<T>("patch", url, body, config, "Erro ao atualizar");
}
async function httpDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return execWithRetry<T>("delete", url, undefined, config, "Erro ao deletar");
}

type Method = "get" | "post" | "patch" | "delete";
interface PendingRetry {
  originalErr: unknown;
  attemptedRefresh: boolean;
}
// Single-flight promise to deduplicate refresh attempts
let ongoingRefresh: Promise<boolean> | null = null;

// Contador global de 401 consecutivos sem sucesso (refresh ou request bem sucedido reseta)
let consecutive401 = 0;
const { MAX_401_BEFORE_FORCED_LOGOUT } = AUTH_SECURITY_CONFIG;

async function attemptRefreshToken(): Promise<boolean> {
  if (ongoingRefresh) return ongoingRefresh;
  ongoingRefresh = (async () => {
    // Tenta refresh via authService (se houver refresh token no storage)
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    const resp = await authService.refreshToken();
    return resp.success;
  })();
  try {
    return await ongoingRefresh;
  } finally {
    ongoingRefresh = null;
  }
}

async function execWithRetry<T>(
  method: Method,
  url: string,
  body: unknown,
  config: AxiosRequestConfig | undefined,
  fallbackMsg: string
): Promise<ApiResponse<T>> {
  const state: PendingRetry = { originalErr: null, attemptedRefresh: false };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let resp;
      if (method === "get") resp = await api.get(url, config);
      else if (method === "post") resp = await api.post(url, body, config);
      else if (method === "patch") resp = await api.patch(url, body, config);
      else resp = await api.delete(url, config);
      // Sucesso: reset contador 401
      if (consecutive401 > 0) consecutive401 = 0;
      return { success: true, data: resp.data };
    } catch (err) {
      state.originalErr = state.originalErr || err;
      const parsed = parseError(err);
      const is401 = parsed.status === 401;
      if (is401 && !state.attemptedRefresh) {
        state.attemptedRefresh = true;
        try {
          const refreshed = await attemptRefreshToken();
          if (refreshed) {
            // refresh ok, não conta como 401 final
            if (consecutive401 > 0) consecutive401 = 0;
            continue; // repete loop (2ª tentativa)
          }
        } catch {
          /* ignore */
        }
      }
      // Falhou ou não era 401 / já tentou refresh
      return buildErrorResponse<T>(err, fallbackMsg);
    }
  }
  return buildErrorResponse<T>(state.originalErr, fallbackMsg);
}

export const http = {
  get: httpGet,
  post: httpPost,
  patch: httpPatch,
  delete: httpDelete,
};

export default http;
