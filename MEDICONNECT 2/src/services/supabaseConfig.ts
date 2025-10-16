// Centraliza configuração Supabase (URL, anon key e credenciais de serviço para token técnico)
// As credenciais de serviço (email/senha) NÃO devem ser as mesmas de um usuário final.
// Defina em .env.local (nunca commitar valores reais):
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...
// VITE_SERVICE_EMAIL=...
// VITE_SERVICE_PASSWORD=...

interface EnvVars {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SERVICE_EMAIL?: string;
  VITE_SERVICE_PASSWORD?: string;
}

const env = (import.meta as ImportMeta).env as unknown as EnvVars;

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || "https://yuanqfswhberkoevtmfr.supabase.co";
// Anon key fixa fornecida (fallback) — ideal mover para env em produção
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ";
export const SERVICE_EMAIL = env.VITE_SERVICE_EMAIL || ""; // se vazio, TokenManager ficará inativo
export const SERVICE_PASSWORD = env.VITE_SERVICE_PASSWORD || "";

export function serviceCredentialsConfigured(): boolean {
  return !!(SERVICE_EMAIL && SERVICE_PASSWORD);
}

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SERVICE_EMAIL,
  SERVICE_PASSWORD,
  serviceCredentialsConfigured,
};
