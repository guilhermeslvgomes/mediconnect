import React, { useState } from "react";
import { Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";

const CadastroMedico: React.FC = () => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    especialidade: "",
    crm: "",
    telefone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validações básicas
    if (!formData.nome.trim()) {
      toast.error("Informe o nome completo");
      return;
    }
    if (!formData.crm.trim() || formData.crm.trim().length < 4) {
      toast.error("CRM inválido");
      return;
    }
    if (!formData.especialidade.trim()) {
      toast.error("Informe a especialidade");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email inválido");
      return;
    }
    if (!formData.telefone.trim()) {
      toast.error("Informe o telefone");
      return;
    }
    if (formData.senha !== formData.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (formData.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const result = await userService.createMedico({
        nome: formData.nome,
        email: formData.email,
        password: formData.senha,
        telefone: formData.telefone,
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao cadastrar médico");
        return;
      }
      toast.success("Cadastro realizado com sucesso!");
      navigate("/login-medico");
    } catch {
      toast.error("Erro ao cadastrar médico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Full-viewport background for this page only */}
      <div
        className="fixed inset-0 bg-white dark:bg-black transition-colors pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cadastro de Médico
          </h1>
          <p className="text-gray-600">
            Preencha os dados para cadastrar um novo médico
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
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
                value={formData.telefone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                }
                placeholder="(11) 99999-9999"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRM
              </label>
              <input
                type="text"
                value={formData.crm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, crm: e.target.value }))
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.especialidade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    especialidade: e.target.value,
                  }))
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="form-input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, senha: e.target.value }))
                  }
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
                  value={formData.confirmarSenha}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmarSenha: e.target.value,
                    }))
                  }
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/login-medico")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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

export default CadastroMedico;
