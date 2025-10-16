import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import medicoService, { type Medico } from "../services/medicoService";
import authService, {
  type UserInfoFullResponse,
} from "../services/authService"; // tokens + user-info
// tokenManager removido no modelo somente Supabase (sem usuário técnico)

// Tipos de roles suportados
export type UserRole =
  | "secretaria"
  | "medico"
  | "paciente"
  | "admin"
  | "gestor"
  | "user"; // Role genérica para pacientes

export interface SessionUserBase {
  id: string;
  nome: string;
  email?: string;
  role: UserRole;
  roles?: UserRole[];
  permissions?: { [k: string]: boolean | undefined };
}

export interface SecretariaUser extends SessionUserBase {
  role: "secretaria";
}
export interface MedicoUser extends SessionUserBase {
  role: "medico";
  crm?: string;
  especialidade?: string;
}
export interface PacienteUser extends SessionUserBase {
  role: "paciente";
  pacienteId?: string;
}
export interface AdminUser extends SessionUserBase {
  role: "admin";
}
export type SessionUser =
  | SecretariaUser
  | MedicoUser
  | PacienteUser
  | AdminUser
  | (SessionUserBase & { role: "gestor" });

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginSecretaria: (email: string, senha: string) => Promise<boolean>;
  loginMedico: (email: string, senha: string) => Promise<boolean>;
  loginComEmailSenha: (email: string, senha: string) => Promise<boolean>; // fluxo unificado real
  loginPaciente: (paciente: {
    id: string;
    nome: string;
    email?: string;
  }) => Promise<boolean>;
  logout: () => void;
  role: UserRole | null;
  roles: UserRole[];
  permissions: Record<string, boolean | undefined>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "appSession";

interface PersistedSession {
  user: SessionUser;
  token?: string; // para quando integrar authService real
  refreshToken?: string;
  savedAt: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Log sempre que user ou loading mudar
  useEffect(() => {
    console.log("[AuthContext] 🔄 ESTADO MUDOU:", {
      user: user ? { id: user.id, nome: user.nome, role: user.role } : null,
      loading,
      isAuthenticated: !!user,
      timestamp: new Date().toISOString(),
    });
  }, [user, loading]);

  // RE-VERIFICAR sessão quando user estiver null mas localStorage tiver dados
  // Isso corrige o problema de navegação entre páginas perdendo o estado
  useEffect(() => {
    if (!loading && !user) {
      console.log(
        "[AuthContext] 🔍 User é null mas loading false, verificando localStorage..."
      );
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as PersistedSession;
          if (parsed?.user?.role) {
            console.log(
              "[AuthContext] 🔧 RECUPERANDO sessão perdida:",
              parsed.user.nome
            );
            setUser(parsed.user);

            // Restaurar tokens também
            if (parsed.token) {
              import("../services/tokenStore").then((module) => {
                module.default.setTokens(parsed.token!, parsed.refreshToken);
              });
            }
          }
        } catch (e) {
          console.error("[AuthContext] Erro ao recuperar sessão:", e);
        }
      }
    }
  }, [user, loading]);

  // Monitorar mudanças no localStorage para debug
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        console.log("[AuthContext] 📢 localStorage MUDOU externamente!", {
          oldValue: e.oldValue ? "TINHA DADOS" : "VAZIO",
          newValue: e.newValue ? "TEM DADOS" : "VAZIO",
          url: e.url,
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Restaurar sessão do localStorage e verificar token
  // IMPORTANTE: Este useEffect roda apenas UMA VEZ quando o AuthProvider monta
  useEffect(() => {
    console.log("[AuthContext] 🚀 INICIANDO RESTAURAÇÃO DE SESSÃO (mount)");
    console.log("[AuthContext] 🔍 Verificando TODOS os itens no localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`  - ${key}: ${value?.substring(0, 50)}...`);
      }
    }

    const restoreSession = async () => {
      try {
        // Tentar localStorage primeiro, depois sessionStorage como backup
        let raw = localStorage.getItem(STORAGE_KEY);
        console.log(
          "[AuthContext] localStorage raw:",
          raw ? "EXISTE" : "VAZIO"
        );

        if (!raw) {
          console.log(
            "[AuthContext] 🔍 localStorage vazio, tentando sessionStorage..."
          );
          raw = sessionStorage.getItem(STORAGE_KEY);
          console.log(
            "[AuthContext] sessionStorage raw:",
            raw ? "EXISTE" : "VAZIO"
          );

          if (raw) {
            // Restaurar do sessionStorage para localStorage
            console.log(
              "[AuthContext] 🔄 Restaurando do sessionStorage para localStorage"
            );
            localStorage.setItem(STORAGE_KEY, raw);
          }
        }

        if (raw) {
          console.log(
            "[AuthContext] Conteúdo completo:",
            raw.substring(0, 100) + "..."
          );
        }
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedSession;
          if (parsed?.user?.role) {
            console.log("[AuthContext] ✅ Restaurando sessão:", {
              nome: parsed.user.nome,
              role: parsed.user.role,
              hasToken: !!parsed.token,
            });

            // Verificar se há tokens válidos salvos
            if (parsed.token) {
              console.log("[AuthContext] Restaurando tokens no tokenStore");
              const tokenStore = (await import("../services/tokenStore"))
                .default;
              tokenStore.setTokens(parsed.token, parsed.refreshToken);
            } else {
              console.warn(
                "[AuthContext] Sessão encontrada mas sem token. Verificando tokenStore..."
              );
              const tokenStore = (await import("../services/tokenStore"))
                .default;
              const existingToken = tokenStore.getAccessToken();
              if (existingToken) {
                console.log(
                  "[AuthContext] Token encontrado no tokenStore, mantendo sessão"
                );
              } else {
                console.warn(
                  "[AuthContext] ⚠️ Nenhum token encontrado. Sessão pode estar inválida."
                );
              }
            }
            console.log(
              "[AuthContext] 📝 Chamando setUser com:",
              parsed.user.nome
            );
            setUser(parsed.user);
          } else {
            console.log(
              "[AuthContext] ⚠️ Sessão parseada mas sem user.role válido"
            );
          }
        } else {
          console.log(
            "[AuthContext] ℹ️ Nenhuma sessão salva encontrada no localStorage"
          );
        }
      } catch (error) {
        console.error("[AuthContext] ❌ Erro ao restaurar sessão:", error);
      } finally {
        console.log(
          "[AuthContext] 🏁 Finalizando restauração, setLoading(false)"
        );
        setLoading(false);
      }
    };
    void restoreSession();
  }, []);

  const persist = useCallback((session: PersistedSession) => {
    try {
      console.log(
        "[AuthContext] 💾 SALVANDO sessão no localStorage E sessionStorage:",
        {
          user: session.user.nome,
          role: session.user.role,
          hasToken: !!session.token,
        }
      );
      const sessionStr = JSON.stringify(session);
      localStorage.setItem(STORAGE_KEY, sessionStr);
      sessionStorage.setItem(STORAGE_KEY, sessionStr); // BACKUP em sessionStorage
      console.log(
        "[AuthContext] ✅ Sessão salva com sucesso em ambos storages!"
      );
    } catch (error) {
      console.error("[AuthContext] ❌ ERRO ao salvar sessão:", error);
    }
  }, []);

  const clearPersisted = useCallback(() => {
    try {
      console.log(
        "[AuthContext] 🗑️ REMOVENDO sessão do localStorage E sessionStorage"
      );
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      console.log(
        "[AuthContext] ✅ Sessão removida com sucesso de ambos storages!"
      );
    } catch (error) {
      console.error("[AuthContext] ❌ ERRO ao remover sessão:", error);
    }
  }, []);

  const normalizeRole = (r: string | undefined): UserRole | undefined => {
    if (!r) return undefined;
    const map: Record<string, UserRole> = {
      medico: "medico",
      doctor: "medico",
      secretaria: "secretaria",
      assistant: "secretaria",
      paciente: "paciente",
      patient: "paciente",
      user: "paciente", // Role genérica mapeada para paciente
      admin: "admin",
      gestor: "gestor",
      manager: "gestor",
    };
    return map[r.toLowerCase()] || undefined;
  };

  const pickPrimaryRole = (rolesArr: UserRole[]): UserRole => {
    const priority: UserRole[] = [
      "admin",
      "gestor",
      "medico",
      "secretaria",
      "paciente",
    ];
    for (const p of priority) if (rolesArr.includes(p)) return p;
    return rolesArr[0] || "paciente";
  };

  const buildSessionUser = React.useCallback(
    (info: UserInfoFullResponse): SessionUser => {
      console.log(
        "[buildSessionUser] info recebido:",
        JSON.stringify(info, null, 2)
      );
      const rolesNormalized = (info.roles || [])
        .map(normalizeRole)
        .filter(Boolean) as UserRole[];
      console.log("[buildSessionUser] roles normalizadas:", rolesNormalized);
      const permissions = info.permissions || {};
      const primaryRole = pickPrimaryRole(
        rolesNormalized.length
          ? rolesNormalized
          : [normalizeRole((info.roles || [])[0]) || "paciente"]
      );
      console.log("[buildSessionUser] primaryRole escolhida:", primaryRole);
      const base = {
        id: info.user?.id || "",
        nome:
          info.profile?.full_name ||
          info.user?.email?.split("@")[0] ||
          "Usuário",
        email: info.user?.email,
        role: primaryRole,
        roles: rolesNormalized,
        permissions,
      } as SessionUserBase;
      console.log("[buildSessionUser] SessionUser final:", base);
      if (primaryRole === "medico") {
        return { ...base, role: "medico" } as MedicoUser;
      }
      if (primaryRole === "secretaria") {
        return { ...base, role: "secretaria" } as SecretariaUser;
      }
      if (primaryRole === "admin") {
        return { ...base, role: "admin" } as AdminUser;
      }
      if (primaryRole === "gestor") {
        return { ...base, role: "gestor" } as SessionUser;
      }
      return { ...base, role: "paciente" } as PacienteUser;
    },
    []
  );

  // LEGADO: manter até que todos os usuários passem a existir no auth real
  const loginSecretaria = useCallback(
    async (email: string, senha: string) => {
      // Mock atual: validar contra credenciais fixas (pode evoluir para authService.login)
      if (email === "secretaria@clinica.com" && senha === "secretaria123") {
        const newUser: SecretariaUser = {
          id: "sec-1",
          nome: "Secretária",
          email,
          role: "secretaria",
          roles: ["secretaria"],
          permissions: {},
        };
        setUser(newUser);
        persist({ user: newUser, savedAt: new Date().toISOString() });
        toast.success("Login realizado");
        return true;
      }
      toast.error("Credenciais inválidas");
      return false;
    },
    [persist]
  );

  // LEGADO: usa service de médicos sem validar senha real (apenas existência)
  const loginMedico = useCallback(
    async (email: string, senha: string) => {
      const resp = await medicoService.loginMedico(email, senha);
      if (!resp.success || !resp.data) {
        toast.error(resp.error || "Erro ao autenticar médico");
        return false;
      }
      const m: Medico = resp.data;
      const newUser: MedicoUser = {
        id: m.id,
        nome: m.nome,
        email: m.email,
        role: "medico",
        crm: m.crm,
        especialidade: m.especialidade,
        roles: ["medico"],
        permissions: {},
      };
      setUser(newUser);
      persist({ user: newUser, savedAt: new Date().toISOString() });
      toast.success(`Bem-vindo(a) Dr(a). ${m.nome}`);
      return true;
    },
    [persist]
  );

  // Fluxo unificado real usando authService + endpoint user-info para mapear role dinâmica
  const loginComEmailSenha = useCallback(
    async (email: string, senha: string) => {
      console.log("[AuthContext] Iniciando login para:", email);
      const loginResp = await authService.login({ email, password: senha });
      console.log("[AuthContext] Resposta login:", loginResp);

      if (!loginResp.success || !loginResp.data) {
        console.error("[AuthContext] Login falhou:", loginResp.error);
        toast.error(loginResp.error || "Falha no login");
        return false;
      }

      console.log("[AuthContext] Token recebido, buscando user-info...");
      // Buscar user-info para descobrir papel
      const infoResp = await authService.getUserInfo();
      console.log("[AuthContext] Resposta user-info:", infoResp);

      if (!infoResp.success || !infoResp.data) {
        console.error(
          "[AuthContext] Falha ao obter user-info:",
          infoResp.error
        );
        toast.error(infoResp.error || "Falha ao obter user-info");
        return false;
      }

      const sessionUser = buildSessionUser(infoResp.data);
      console.log("[AuthContext] Usuário da sessão criado:", sessionUser);
      setUser(sessionUser);
      persist({
        user: sessionUser,
        savedAt: new Date().toISOString(),
        token: loginResp.data.access_token,
        refreshToken: loginResp.data.refresh_token,
      });
      console.log("[AuthContext] Login completo!");
      toast.success("Login realizado");
      return true;
    },
    [persist, buildSessionUser]
  );

  // Para paciente, aproveitamos fluxo existente: quando o paciente já foi validado externamente no loginPaciente
  const loginPaciente = useCallback(
    async (paciente: { id: string; nome: string; email?: string }) => {
      console.log("[AuthContext] loginPaciente chamado com:", paciente);
      const newUser: PacienteUser = {
        id: paciente.id,
        nome: paciente.nome,
        email: paciente.email,
        role: "paciente",
        pacienteId: paciente.id,
        roles: ["paciente"],
        permissions: {},
      };
      console.log("[AuthContext] Usuário criado:", newUser);
      setUser(newUser);
      persist({ user: newUser, savedAt: new Date().toISOString() });
      // Bridge para páginas que ainda leem localStorage("pacienteLogado")
      try {
        const legacy = {
          _id: paciente.id,
          nome: paciente.nome,
          email: paciente.email ?? "",
          cpf: "",
          telefone: "",
        };
        localStorage.setItem("pacienteLogado", JSON.stringify(legacy));
      } catch {
        // ignore
      }
      console.log("[AuthContext] Usuário persistido no localStorage");
      toast.success(`Bem-vindo(a), ${paciente.nome}`);
      return true;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    console.log("[AuthContext] Iniciando logout...");
    try {
      const resp = await authService.logout(); // chama /auth/v1/logout (204 esperado)
      if (!resp.success && resp.error) {
        console.warn("[AuthContext] Falha no logout remoto:", resp.error);
        toast.error(`Falha no logout remoto: ${resp.error}`);
      } else {
        console.log("[AuthContext] Logout remoto bem-sucedido");
      }
    } catch (e) {
      console.warn(
        "[AuthContext] Erro inesperado ao executar logout remoto",
        e
      );
    } finally {
      // Limpa contexto local
      console.log("[AuthContext] Limpando estado local...");
      setUser(null);
      clearPersisted();
      authService.clearLocalAuth();
      try {
        localStorage.removeItem("pacienteLogado");
      } catch {
        // ignore
      }
      console.log("[AuthContext] Logout completo - usuário removido do estado");
      // Modelo somente Supabase: nenhum token técnico para invalidar
    }
  }, [clearPersisted]);

  const refreshSession = useCallback(async () => {
    // Futuro: usar refresh token real. Agora apenas revalida estrutura.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedSession;
      if (!parsed?.user?.role) return;
      setUser(parsed.user);
    } catch {
      // ignorar
    }
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      roles: user?.roles || (user?.role ? [user.role] : []),
      permissions: user?.permissions || {},
      isAuthenticated: !!user,
      loading,
      loginSecretaria,
      loginMedico,
      loginComEmailSenha,
      loginPaciente,
      logout,
      refreshSession,
    }),
    [
      user,
      loading,
      loginSecretaria,
      loginMedico,
      loginComEmailSenha,
      loginPaciente,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
