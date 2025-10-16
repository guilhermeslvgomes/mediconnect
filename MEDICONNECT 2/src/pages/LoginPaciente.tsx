import React, { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginPaciente: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCadastro, setShowCadastro] = useState(false);
  const [cadastroData, setCadastroData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    cpf: "",
    dataNascimento: "",
    convenio: "",
    altura: "",
    peso: "",
    cep: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCEP = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, "").length < 8) return;
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`
      );
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setCadastroData((prev) => ({
        ...prev,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    }
  };

  const navigate = useNavigate();

  const { loginPaciente } = useAuth();

  // Credenciais fixas para LOGIN LOCAL de paciente
  const LOCAL_PATIENT = {
    email: "guilhermesilvagomes1020@gmail.com",
    senha: "guilherme123",
    nome: "Guilherme Silva Gomes",
    id: "guilhermesilvagomes1020@gmail.com",
  } as const;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("[LoginPaciente] Fazendo login com email:", formData.email);

      // Fazer login via API Supabase
      const authService = (await import("../services/authService")).default;
      const loginResult = await authService.login({
        email: formData.email,
        password: formData.senha,
      });

      if (!loginResult.success) {
        console.log("[LoginPaciente] Erro no login:", loginResult.error);
        toast.error(loginResult.error || "Email ou senha incorretos");
        setLoading(false);
        return;
      }

      console.log("[LoginPaciente] Login bem-sucedido!", loginResult.data);

      // Verificar se o token foi salvo
      const tokenStore = (await import("../services/tokenStore")).default;
      const token = tokenStore.getAccessToken();
      const refreshToken = tokenStore.getRefreshToken();
      console.log("[LoginPaciente] Token salvo:", token ? "SIM" : "NÃO");
      console.log(
        "[LoginPaciente] Refresh token salvo:",
        refreshToken ? "SIM" : "NÃO"
      );

      if (!token) {
        console.error(
          "[LoginPaciente] Token não foi salvo! Dados do login:",
          loginResult.data
        );
        toast.error("Erro ao salvar credenciais de autenticação");
        setLoading(false);
        return;
      }

      // Buscar dados do paciente da API
      const { listPatients } = await import("../services/pacienteService");
      const pacientesResult = await listPatients({ search: formData.email });

      console.log(
        "[LoginPaciente] Resultado da busca de pacientes:",
        pacientesResult
      );

      const paciente = pacientesResult.data?.[0];

      if (paciente) {
        console.log("[LoginPaciente] Paciente encontrado:", {
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
        });
        const ok = await loginPaciente({
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
        });

        if (ok) {
          console.log("[LoginPaciente] Navegando para /acompanhamento");
          navigate("/acompanhamento");
        } else {
          console.error("[LoginPaciente] loginPaciente retornou false");
          toast.error("Erro ao processar login");
        }
      } else {
        console.log("[LoginPaciente] Paciente não encontrado na lista");
        toast.error(
          "Dados do paciente não encontrados. Entre em contato com o suporte."
        );
      }
    } catch (error) {
      console.error("[LoginPaciente] Erro no login:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    // Redirecionar para a página de cadastro dedicada
    navigate("/cadastro-paciente");
  };

  // Login LOCAL: cria uma sessão de paciente sem chamar a API
  const handleLoginLocal = async () => {
    const email = formData.email.trim();
    const senha = formData.senha;

    console.log("[LoginPaciente] Login local - tentando com API primeiro");

    // Tentar fazer login via API mesmo no modo "local"
    setLoading(true);
    try {
      // Fazer login via API Supabase
      const authService = (await import("../services/authService")).default;
      const loginResult = await authService.login({
        email: email,
        password: senha,
      });

      if (!loginResult.success) {
        console.log(
          "[LoginPaciente] Login via API falhou, usando modo local sem token"
        );
        console.log("[LoginPaciente] Erro:", loginResult.error);

        // Fallback: validar credenciais locais hardcoded
        if (email !== LOCAL_PATIENT.email || senha !== LOCAL_PATIENT.senha) {
          toast.error("Credenciais inválidas");
          setLoading(false);
          return;
        }

        // Login local SEM token (modo de desenvolvimento)
        toast(
          "⚠️ Modo local ativo: algumas funcionalidades podem não funcionar sem API",
          {
            icon: "⚠️",
            duration: 5000,
          }
        );
        const ok = await loginPaciente({
          id: LOCAL_PATIENT.id,
          nome: LOCAL_PATIENT.nome,
          email: LOCAL_PATIENT.email,
        });

        if (ok) {
          navigate("/acompanhamento");
        } else {
          toast.error("Não foi possível iniciar a sessão local");
        }
        setLoading(false);
        return;
      }

      console.log("[LoginPaciente] Login via API bem-sucedido!");

      // Verificar se o token foi salvo
      const tokenStore = (await import("../services/tokenStore")).default;
      const token = tokenStore.getAccessToken();
      console.log("[LoginPaciente] Token salvo:", token ? "SIM" : "NÃO");

      // Buscar dados do paciente da API
      const { listPatients } = await import("../services/pacienteService");
      const pacientesResult = await listPatients({ search: email });

      const paciente = pacientesResult.data?.[0];

      if (paciente) {
        console.log(
          "[LoginPaciente] Paciente encontrado na API:",
          paciente.nome
        );
        const ok = await loginPaciente({
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
        });

        if (ok) {
          navigate("/acompanhamento");
        } else {
          toast.error("Erro ao processar login");
        }
      } else {
        console.log(
          "[LoginPaciente] Paciente não encontrado na API, usando dados locais"
        );
        const ok = await loginPaciente({
          id: email,
          nome: email.split("@")[0],
          email: email,
        });

        if (ok) {
          navigate("/acompanhamento");
        } else {
          toast.error("Erro ao processar login");
        }
      }
    } catch (err) {
      console.error("[LoginPaciente] Erro no login:", err);
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-700 to-blue-400 dark:from-blue-800 dark:to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {showCadastro ? "Criar Conta" : "Área do Paciente"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {showCadastro
              ? "Preencha seus dados para criar sua conta"
              : "Faça login para acompanhar suas consultas"}
          </p>
        </div>

        {/* Formulário */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-transparent dark:border-gray-700 transition-colors"
          aria-live="polite"
        >
          {!showCadastro ? (
            /* Formulário de Login */
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              <div>
                <label
                  htmlFor="login_email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
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
                  htmlFor="login_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login_password"
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        senha: e.target.value,
                      }))
                    }
                    className="form-input pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="Sua senha"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/** Botão original (remoto) comentado a pedido **/}
              {/**
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
              **/}

              <button
                type="button"
                onClick={handleLoginLocal}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                <strong>{LOCAL_PATIENT.email}</strong> /{" "}
                <strong>{LOCAL_PATIENT.senha}</strong>
              </p>
            </form>
          ) : (
            /* Formulário de Cadastro */
            <form onSubmit={handleCadastro} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_nome"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Nome Completo
                  </label>
                  <input
                    id="cad_nome"
                    type="text"
                    value={cadastroData.nome}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cad_cpf"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    CPF
                  </label>
                  <input
                    id="cad_cpf"
                    type="text"
                    value={cadastroData.cpf}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        cpf: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="000.000.000-00"
                    required
                    inputMode="numeric"
                    pattern="^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_cep"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    CEP
                  </label>
                  <input
                    id="cad_cep"
                    type="text"
                    value={cadastroData.cep}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        cep: e.target.value,
                      }))
                    }
                    onBlur={() => buscarEnderecoPorCEP(cadastroData.cep)}
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="00000-000"
                    required
                    inputMode="numeric"
                    pattern="^\d{5}-?\d{3}$"
                    autoComplete="postal-code"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cad_logradouro"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Logradouro
                  </label>
                  <input
                    id="cad_logradouro"
                    type="text"
                    value={cadastroData.logradouro}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        logradouro: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="address-line1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_bairro"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Bairro
                  </label>
                  <input
                    id="cad_bairro"
                    type="text"
                    value={cadastroData.bairro}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        bairro: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="address-line2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cad_cidade"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Cidade
                  </label>
                  <input
                    id="cad_cidade"
                    type="text"
                    value={cadastroData.cidade}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        cidade: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="address-level2"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="cad_estado"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Estado
                </label>
                <input
                  id="cad_estado"
                  type="text"
                  value={cadastroData.estado}
                  onChange={(e) =>
                    setCadastroData((prev) => ({
                      ...prev,
                      estado: e.target.value,
                    }))
                  }
                  className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                  required
                  autoComplete="address-level1"
                />
              </div>

              <div>
                <label
                  htmlFor="cad_email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="cad_email"
                  type="email"
                  value={cadastroData.email}
                  onChange={(e) =>
                    setCadastroData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_senha"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Senha
                  </label>
                  <input
                    id="cad_senha"
                    type="password"
                    value={cadastroData.senha}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        senha: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cad_confirma_senha"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Confirmar Senha
                  </label>
                  <input
                    id="cad_confirma_senha"
                    type="password"
                    value={cadastroData.confirmarSenha}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        confirmarSenha: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="new-password"
                    aria-invalid={
                      cadastroData.confirmarSenha !== "" &&
                      cadastroData.confirmarSenha !== cadastroData.senha
                    }
                    aria-describedby={
                      cadastroData.confirmarSenha !== "" &&
                      cadastroData.confirmarSenha !== cadastroData.senha
                        ? "cad_senha_help"
                        : undefined
                    }
                  />
                  {cadastroData.confirmarSenha !== "" &&
                    cadastroData.confirmarSenha !== cadastroData.senha && (
                      <p
                        id="cad_senha_help"
                        className="mt-1 text-xs text-red-400"
                      >
                        As senhas não coincidem.
                      </p>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_telefone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Telefone
                  </label>
                  <input
                    id="cad_telefone"
                    type="tel"
                    value={cadastroData.telefone}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        telefone: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="(11) 99999-9999"
                    required
                    inputMode="numeric"
                    pattern="^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cad_data_nasc"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Data de Nascimento
                  </label>
                  <input
                    id="cad_data_nasc"
                    type="date"
                    value={cadastroData.dataNascimento}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        dataNascimento: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    required
                    autoComplete="bday"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cad_convenio"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Convênio
                </label>
                <select
                  id="cad_convenio"
                  value={cadastroData.convenio}
                  onChange={(e) =>
                    setCadastroData((prev) => ({
                      ...prev,
                      convenio: e.target.value,
                    }))
                  }
                  className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                >
                  <option value="">Selecione</option>
                  <option value="Particular">Particular</option>
                  <option value="Unimed">Unimed</option>
                  <option value="Bradesco Saúde">Bradesco Saúde</option>
                  <option value="SulAmérica">SulAmérica</option>
                  <option value="Amil">Amil</option>
                  <option value="NotreDame">NotreDame</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cad_altura"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Altura (cm)
                  </label>
                  <input
                    id="cad_altura"
                    type="number"
                    value={cadastroData.altura}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        altura: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="170"
                    min="50"
                    max="250"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cad_peso"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Peso (kg)
                  </label>
                  <input
                    id="cad_peso"
                    type="number"
                    value={cadastroData.peso}
                    onChange={(e) =>
                      setCadastroData((prev) => ({
                        ...prev,
                        peso: e.target.value,
                      }))
                    }
                    className="form-input dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-100"
                    placeholder="70"
                    min="20"
                    max="300"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCadastro(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-blue-400 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPaciente;
