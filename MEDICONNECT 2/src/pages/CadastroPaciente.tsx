import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";
import { buscarEnderecoViaCEP } from "../services/pacienteService";

const INITIAL_STATE = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  cpf: "",
  telefone: "",
  dataNascimento: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

const CadastroPaciente: React.FC = () => {
  const [form, setForm] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [autoEndereco, setAutoEndereco] = useState(false);
  const navigate = useNavigate();

  const update = (patch: Partial<typeof INITIAL_STATE>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleBuscarCEP = async () => {
    const clean = form.cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast.error("CEP inválido");
      return;
    }
    try {
      const end = await buscarEnderecoViaCEP(clean);
      if (!end) {
        toast.error("CEP não encontrado");
        return;
      }
      update({
        rua: end.rua || "",
        bairro: end.bairro || "",
        cidade: end.cidade || "",
        estado: end.estado || "",
      });
      setAutoEndereco(true);
    } catch {
      toast.error("Falha ao buscar CEP");
    }
  };

  const validate = (): boolean => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email inválido");
      return false;
    }
    if (!form.cpf.trim() || form.cpf.replace(/\D/g, "").length < 11) {
      toast.error("CPF inválido");
      return false;
    }
    if (!form.telefone.trim()) {
      toast.error("Telefone é obrigatório");
      return false;
    }
    if (!form.senha || form.senha.length < 6) {
      toast.error("Senha mínima 6 caracteres");
      return false;
    }
    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      console.log("[CadastroPaciente] Iniciando cadastro via API Supabase...");

      // ETAPA 1: Criar usuário no Supabase Auth (gera token JWT)
      console.log("[CadastroPaciente] Criando usuário de autenticação...");
      const result = await userService.signupPaciente({
        nome: form.nome,
        email: form.email,
        password: form.senha,
        telefone: form.telefone,
        cpf: form.cpf,
        dataNascimento: form.dataNascimento,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        },
      });

      if (!result.success) {
        console.error("[CadastroPaciente] Erro no cadastro:", result.error);
        toast.error(result.error || "Erro ao cadastrar paciente");
        return;
      }

      const userId = result.data?.id;
      console.log("[CadastroPaciente] Usuário criado com sucesso! ID:", userId);

      // ETAPA 2: Criar registro de paciente usando token JWT do signup
      console.log("[CadastroPaciente] Criando registro de paciente na API...");
      const { createPatient } = await import("../services/pacienteService");

      const pacienteResult = await createPatient({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cpf: form.cpf,
        dataNascimento: form.dataNascimento,
        endereco: {
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          cep: form.cep,
        },
      });

      if (!pacienteResult.success) {
        console.error(
          "[CadastroPaciente] Erro ao criar paciente:",
          pacienteResult.error
        );
        console.log(
          "[CadastroPaciente] Usuário criado mas dados do paciente não foram salvos completamente"
        );
        // Não mostra erro para o usuário - ele pode fazer login mesmo assim
      } else {
        console.log(
          "[CadastroPaciente] Paciente criado com sucesso!",
          pacienteResult.data
        );
      }

      toast.success(
        "Paciente cadastrado com sucesso! Faça login para acessar."
      );
      navigate("/paciente");
    } catch (error) {
      console.error("[CadastroPaciente] Erro inesperado:", error);
      toast.error("Erro inesperado ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cadastro de Paciente
          </h1>
          <p className="text-gray-600">
            Crie sua conta para acessar o acompanhamento e agendamentos.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => update({ nome: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => update({ dataNascimento: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => update({ cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => update({ telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => update({ senha: e.target.value })}
                  className="form-input"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => update({ confirmarSenha: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Endereço opcional */}
            <div className="pt-2 border-t">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                Endereço (opcional)
              </h2>
              <div className="grid md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    CEP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.cep}
                      onChange={(e) => {
                        setAutoEndereco(false);
                        update({ cep: e.target.value });
                      }}
                      className="form-input"
                      placeholder="00000000"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarCEP}
                      className="px-3 py-2 text-xs rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={form.rua}
                    onChange={(e) => update({ rua: e.target.value })}
                    className="form-input"
                    disabled={autoEndereco}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={(e) => update({ numero: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={form.bairro}
                    onChange={(e) => update({ bairro: e.target.value })}
                    className="form-input"
                    disabled={autoEndereco}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => update({ cidade: e.target.value })}
                    className="form-input"
                    disabled={autoEndereco}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={form.estado}
                    onChange={(e) => update({ estado: e.target.value })}
                    className="form-input"
                    disabled={autoEndereco}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={form.complemento}
                    onChange={(e) => update({ complemento: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/paciente")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastroPaciente;
