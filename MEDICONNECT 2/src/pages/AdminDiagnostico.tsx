import { useState, useEffect, useCallback } from "react";

interface TokenInfo {
  key: string;
  present: boolean;
  value?: string;
  preview?: string;
  decoded?: {
    valid: boolean;
    expired?: boolean;
    exp?: number;
    sub?: string;
    email?: string;
    role?: string;
  };
}

export default function AdminDiagnostico() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const decodeJwt = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return { valid: false } as const;
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expired = payload.exp ? payload.exp < now : false;
      return {
        valid: true,
        expired,
        exp: payload.exp,
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      } as const;
    } catch {
      return { valid: false } as const;
    }
  };

  const scanTokens = useCallback(() => {
    const keys = [
      "authToken",
      "token",
      "refreshToken",
      "authUser",
      "appSession",
    ];
    const results: TokenInfo[] = keys.map((key) => {
      const value = localStorage.getItem(key);
      if (!value) return { key, present: false };

      const info: TokenInfo = {
        key,
        present: true,
        value,
        preview: value.length > 100 ? value.substring(0, 100) + "..." : value,
      };

      if (key === "authToken" || key === "token") {
        info.decoded = decodeJwt(value);
      }

      return info;
    });
    setTokens(results);
    addLog("Tokens escaneados");
  }, [addLog]);

  const clearExpiredTokens = () => {
    let cleared = 0;
    tokens.forEach((t) => {
      if (t.decoded?.expired) {
        localStorage.removeItem(t.key);
        cleared++;
        addLog(`❌ Removido: ${t.key} (expirado)`);
      }
    });
    if (cleared === 0) {
      addLog("✅ Nenhum token expirado encontrado");
    } else {
      addLog(`✅ ${cleared} token(s) expirado(s) removido(s)`);
    }
    scanTokens();
  };

  const clearAllTokens = () => {
    const keys = [
      "authToken",
      "token",
      "refreshToken",
      "authUser",
      "appSession",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    addLog("🗑️ TODOS os tokens removidos");
    scanTokens();
  };

  const testLogin = async () => {
    addLog("🔐 Testando login...");
    try {
      const response = await fetch(
        "https://yuanqfswhberkoevtmfr.supabase.co/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ",
          },
          body: JSON.stringify({
            email: "riseup@popcode.com.br",
            password: "riseup",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        localStorage.setItem("authUser", JSON.stringify(data.user));
        addLog(
          `✅ Login OK! Token salvo. exp=${decodeJwt(data.access_token).exp}`
        );
        scanTokens();
      } else {
        const text = await response.text();
        addLog(`❌ Login falhou: ${response.status} ${text}`);
      }
    } catch (error) {
      addLog(`❌ Erro: ${error}`);
    }
  };

  useEffect(() => {
    scanTokens();
    addLog("Página de diagnóstico carregada");
  }, [scanTokens, addLog]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🔧 Admin - Diagnóstico de Autenticação
        </h1>

        {/* Ações */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ações</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={scanTokens}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              🔄 Escanear Tokens
            </button>
            <button
              onClick={clearExpiredTokens}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
            >
              🧹 Limpar Expirados
            </button>
            <button
              onClick={clearAllTokens}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              🗑️ Limpar TODOS
            </button>
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              🔐 Testar Login Admin
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              ♻️ Recarregar Página
            </button>
          </div>
        </div>

        {/* Tokens */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tokens no localStorage</h2>
          <div
            className="space-y-4"
            role="list"
            aria-label="Lista de tokens no armazenamento local"
          >
            {tokens.length === 0 && (
              <p className="text-gray-500">Nenhum token encontrado</p>
            )}
            {tokens.map((t) => (
              <div
                key={t.key}
                role="listitem"
                className={`p-4 rounded border-2 ${
                  !t.present
                    ? "border-gray-300 bg-gray-50"
                    : t.decoded?.expired
                    ? "border-red-300 bg-red-50"
                    : t.decoded?.valid
                    ? "border-green-300 bg-green-50"
                    : "border-blue-300 bg-blue-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-mono font-bold">{t.key}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      !t.present
                        ? "bg-gray-200 text-gray-700"
                        : t.decoded?.expired
                        ? "bg-red-200 text-red-800"
                        : t.decoded?.valid
                        ? "bg-green-200 text-green-800"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {!t.present
                      ? "AUSENTE"
                      : t.decoded?.expired
                      ? "EXPIRADO"
                      : t.decoded?.valid
                      ? "VÁLIDO"
                      : "PRESENTE"}
                  </span>
                </div>
                {t.present && (
                  <>
                    <p className="text-xs text-gray-600 break-all font-mono mb-2">
                      {t.preview}
                    </p>
                    {t.decoded && (
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-semibold">Válido:</span>{" "}
                          {t.decoded.valid ? "✅" : "❌"}
                        </p>
                        {t.decoded.expired !== undefined && (
                          <p>
                            <span className="font-semibold">Expirado:</span>{" "}
                            {t.decoded.expired ? "⚠️ SIM" : "✅ NÃO"}
                          </p>
                        )}
                        {t.decoded.exp && (
                          <p>
                            <span className="font-semibold">Expira em:</span>{" "}
                            {new Date(t.decoded.exp * 1000).toLocaleString()}
                          </p>
                        )}
                        {t.decoded.email && (
                          <p>
                            <span className="font-semibold">Email:</span>{" "}
                            {t.decoded.email}
                          </p>
                        )}
                        {t.decoded.role && (
                          <p>
                            <span className="font-semibold">Role:</span>{" "}
                            {t.decoded.role}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="bg-gray-900 text-green-400 rounded-lg shadow p-6 font-mono text-sm">
          <h2
            id="diagnostic-log-title"
            className="text-xl font-semibold mb-4 text-white"
          >
            📋 Log
          </h2>
          <div
            className="space-y-1 max-h-96 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-labelledby="diagnostic-log-title"
            tabIndex={0}
          >
            {log.length === 0 && (
              <p className="text-gray-500">Nenhuma ação ainda</p>
            )}
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Esta página ajuda a diagnosticar problemas de autenticação
            </li>
            <li>
              • Tokens expirados causam erro 401 "No API key found in request"
            </li>
            <li>• Use "Limpar Expirados" para remover tokens inválidos</li>
            <li>
              • Use "Testar Login Admin" para obter token válido
              (riseup@popcode.com.br)
            </li>
            <li>
              • Após limpar/login, recarregue a página para aplicar mudanças
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
