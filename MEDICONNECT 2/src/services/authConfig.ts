// Configurações relacionadas à autenticação / segurança no cliente.
// Centraliza tunables para facilitar ajuste e documentação.

export const AUTH_SECURITY_CONFIG = {
  MAX_401_BEFORE_FORCED_LOGOUT: 3,
};

export type AuthSecurityConfig = typeof AUTH_SECURITY_CONFIG;
