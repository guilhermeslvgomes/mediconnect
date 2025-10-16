import React, { useState } from "react";
import { Mail, Lock, Clipboard } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginSecretaria: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loginComEmailSenha } = useAuth();

  // Credenciais fixas para LOGIN LOCAL de secretaria
  const LOCAL_SECRETARIA = {
    email: "secretaria.mediconnect@gmail.com",
    senha: "secretaria@mediconnect",
    nome: "Secretaria MediConnect",
    id: "secretaria.mediconnect@gmail.com",
  } as const;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("[LoginSecretaria] Fazendo login com email:", formData.email);

      const authService = (await import("../services/authService")).default;
      const loginResult = await authService.login({
        email: formData.email,
        password: formData.senha,
      });

      if (!loginResult.success) {
        console.log("[LoginSecretaria] Erro no login:", loginResult.error);
        toast.error(loginResult.error || "Email ou senha incorretos");
        setLoading(false);
        return;
      }

      console.log("[LoginSecretaria] Login bem-sucedido!", loginResult.data);

      const tokenStore = (await import("../services/tokenStore")).default;
      const token = tokenStore.getAccessToken();
      console.log("[LoginSecretaria] Token salvo:", token ? "SIM" : "NÃO");

      if (!token) {
        console.error("[LoginSecretaria] Token não foi salvo!");
        toast.error("Erro ao salvar credenciais de autenticação");
        setLoading(false);
        return;
      }

      const ok = await loginComEmailSenha(formData.email, formData.senha);

      if (ok) {
        console.log("[LoginSecretaria] Navegando para /painel-secretaria");
        toast.success("Login realizado com sucesso!");
        navigate("/painel-secretaria");
      } else {
        console.error("[LoginSecretaria] loginComEmailSenha retornou false");
        toast.error("Erro ao processar login");
      }
    } catch (error) {
      console.error("[LoginSecretaria] Erro no login:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-600 to-green-400 dark:from-green-700 dark:to-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Clipboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Área da Secretaria
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Faça login para acessar o sistema de gestão
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-transparent dark:border-gray-700 transition-colors"
          aria-live="polite"
        >
          <form onSubmit={handleLogin} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="sec_email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="sec_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="form-input pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sec_password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="sec_password"
                  type="password"
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, senha: e.target.value }))
                  }
                  className="form-input pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
              <strong>{LOCAL_SECRETARIA.email}</strong> /{" "}
              <strong>{LOCAL_SECRETARIA.senha}</strong>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginSecretaria;
