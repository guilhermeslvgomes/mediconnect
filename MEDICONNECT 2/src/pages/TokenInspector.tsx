import React, { useEffect, useState } from "react";
import { decodeJwt } from "../services/tokenDebug";
import authService from "../services/authService";

interface DecodedInfo {
  exp?: number;
  iat?: number;
  email?: string;
  [k: string]: unknown;
}

const formatTs = (unix?: number) => {
  if (!unix) return "-";
  const d = new Date(unix * 1000);
  return d.toLocaleString();
};

const TokenInspector: React.FC = () => {
  const [token, setToken] = useState<string | null>("");
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeJwt> | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const t = localStorage.getItem("authToken");
    setToken(t);
    if (t) setDecoded(decodeJwt(t));
    else setDecoded(null);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    const resp = await authService.refreshToken();
    if (!resp.success) setError(resp.error || "Falha ao renovar");
    load();
    setRefreshing(false);
  };

  const payload: DecodedInfo | undefined = decoded?.payload;
  const expired = decoded?.expired;
  const exp = payload?.exp;
  const iat = payload?.iat;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Token Inspector</h1>
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Token atual (localStorage: authToken)
          </p>
          <button
            onClick={load}
            aria-label="Recarregar token do localStorage"
            className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Recarregar
          </button>
        </div>
        <textarea
          className="w-full text-xs font-mono border rounded p-2 h-32"
          readOnly
          value={token || ""}
        />
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div
            className={`p-3 rounded border ${
              expired
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
            }`}
          >
            <p>
              <strong>Status:</strong>{" "}
              {decoded ? (expired ? "EXPIRADO" : "VÁLIDO") : "SEM TOKEN"}
            </p>
            <p>
              <strong>Expiração:</strong> {formatTs(exp)}
            </p>
            <p>
              <strong>Emitido:</strong> {formatTs(iat)}
            </p>
            {exp && (
              <p>
                <strong>TTL restante (s):</strong>{" "}
                {Math.max(0, exp - Math.floor(Date.now() / 1000))}
              </p>
            )}
          </div>
          <div className="p-3 rounded border bg-gray-50">
            <p className="font-semibold mb-1">Claims Principais</p>
            <pre className="text-[11px] whitespace-pre-wrap leading-tight">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {refreshing ? "Renovando..." : "Forçar Refresh"}
          </button>
          <button
            onClick={() => {
              authService.logout();
              load();
            }}
            className="px-4 py-2 rounded bg-gray-200 text-sm hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            aria-label="Fazer logout e limpar token"
          >
            Logout
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(token || "");
            }}
            disabled={!token}
            className="px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            aria-label="Copiar token para a área de transferência"
          >
            Copiar
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <p className="text-xs text-gray-500">
        Página apenas para depuração em desenvolvimento. Remover antes de
        produção.
      </p>
    </div>
  );
};

export default TokenInspector;
