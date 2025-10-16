// Utilitário de depuração de JWT (somente DEV) – NÃO enviar para produção sem revisão.
// Permite inspecionar rapidamente expiração e payload do token armazenado.

export interface DecodedJWT {
  header?: Record<string, unknown>;
  payload?: Record<string, unknown> & { exp?: number; iat?: number };
  raw?: string;
  valid: boolean;
  expired?: boolean;
  expiresAt?: Date;
}

function base64UrlDecode(segment: string): string {
  try {
    const padded =
      segment.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((segment.length + 3) % 4);
    return decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch {
    return "";
  }
}

export function decodeJwt(token?: string | null): DecodedJWT {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length < 2) return { valid: false, raw: token };
  let header: Record<string, unknown> | undefined;
  let payload: Record<string, unknown> | undefined;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]) || "{}");
  } catch {
    /* ignore */
  }
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]) || "{}") as Record<
      string,
      unknown
    >;
  } catch {
    /* ignore */
  }
  let expired: boolean | undefined;
  let expiresAt: Date | undefined;
  const exp = (payload?.exp as number | undefined) || undefined;
  if (exp) {
    expiresAt = new Date(exp * 1000);
    expired = Date.now() > exp * 1000;
  }
  return {
    header,
    payload: payload as DecodedJWT["payload"],
    raw: token,
    valid: true,
    expired,
    expiresAt,
  };
}

export function logCurrentToken(prefix = "[tokenDebug]") {
  try {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");
    const decoded = decodeJwt(token);
    if (!decoded.valid) {
      console.info(prefix, "Nenhum token válido encontrado.");
      return decoded;
    }
    console.info(
      prefix,
      "exp=",
      decoded.payload?.exp,
      decoded.expiresAt ? decoded.expiresAt.toISOString() : undefined,
      decoded.expired ? "(EXPIRADO)" : "(válido)",
      {
        sub: decoded.payload?.sub,
        role: decoded.payload?.role,
        email: decoded.payload?.email,
      }
    );
    return decoded;
  } catch (e) {
    console.warn(prefix, "Falha ao inspecionar token", e);
    return { valid: false } as DecodedJWT;
  }
}

// Expor em window (dev) se disponível
declare global {
  interface Window {
    __logTokenInfo?: () => void;
  }
}
if (typeof window !== "undefined") {
  window.__logTokenInfo = () => {
    logCurrentToken();
  };
}

export default { decodeJwt, logCurrentToken };
