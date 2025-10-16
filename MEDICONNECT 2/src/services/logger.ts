// Central logging adapter with redaction of sensitive data (JWTs, emails).
// Usage: import { logger } from './logger'; logger.info('message', meta)
// Redaction aims: JWT tokens (three base64url segments), refresh tokens, emails.

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

interface LoggerOptions {
  enabled?: boolean;
  level?: LogLevel;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_PATTERNS: Array<RegExp> = [
  /\b([A-Za-z0-9-_]{8,})\.([A-Za-z0-9-_]{8,})\.([A-Za-z0-9-_]{8,})\b/g, // JWT like
  /\brefresh[_-]?token[a-z0-9]*=([A-Za-z0-9-_]+)/gi,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // emails
];

// CPF simples (11 dígitos, opcionalmente com . e -). Será mascarado mantendo últimos 2 dígitos.
const CPF_PATTERN = /\b(\d{3})[.]?(\d{3})[.]?(\d{3})[-]?(\d{2})\b/g;

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    let redacted = value;
    for (const pattern of SENSITIVE_PATTERNS)
      redacted = redacted.replace(pattern, "[REDACTED]");
    redacted = redacted.replace(
      CPF_PATTERN,
      (_m, _a, _b, _c, d4) => `***CPF***${d4}`
    );
    return redacted;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/token|password|secret|email/i.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

class Logger {
  private level: LogLevel;
  private enabled: boolean;

  constructor(opts: LoggerOptions = {}) {
    this.level = opts.level || "debug";
    this.enabled = opts.enabled !== false;
  }

  setLevel(l: LogLevel) {
    this.level = l;
  }
  disable() {
    this.enabled = false;
  }
  enable() {
    this.enabled = true;
  }

  private shouldLog(l: LogLevel) {
    return this.enabled && LEVEL_ORDER[l] >= LEVEL_ORDER[this.level];
  }

  private emit(l: LogLevel, msg: string, meta?: LogMeta) {
    if (!this.shouldLog(l)) return;
    const ts = new Date().toISOString();
    const safeMeta = meta ? redact(meta) : undefined;
    const line = `[${ts}] ${l.toUpperCase()} ${msg}`;
    if (l === "error") console.error(line, safeMeta || "");
    else if (l === "warn") console.warn(line, safeMeta || "");
    else if (l === "info") console.info(line, safeMeta || "");
    else console.debug(line, safeMeta || "");
  }

  debug(msg: string, meta?: LogMeta) {
    this.emit("debug", msg, meta);
  }
  info(msg: string, meta?: LogMeta) {
    this.emit("info", msg, meta);
  }
  warn(msg: string, meta?: LogMeta) {
    this.emit("warn", msg, meta);
  }
  error(msg: string, meta?: LogMeta) {
    this.emit("error", msg, meta);
  }
}

// Vite define import.meta.env; tipagem simples para evitar any.
interface ImportMetaEnvLite {
  MODE?: string;
}
const MODE =
  (import.meta as unknown as { env?: ImportMetaEnvLite }).env?.MODE ||
  "development";
export const logger = new Logger({
  level: MODE === "production" ? "info" : "debug",
});
export default logger;
