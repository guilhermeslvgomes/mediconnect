import React, { useState } from "react";
import userService from "../services/userService";
import toast from "react-hot-toast";
import { ApiResponse } from "../services/http";

const TesteCadastroSquad18: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ApiResponse<{
    id: string;
    email: string;
  }> | null>(null);

  const handleTestar = async () => {
    setLoading(true);
    setResultado(null);

    try {
      console.log("🧪 [TESTE SQUAD 18] Iniciando cadastro...");

      const result = await userService.signupPaciente({
        nome: "Paciente Teste SQUAD 18",
        email: "teste.squad18@clinica.com",
        password: "123456",
        telefone: "11999998888",
        cpf: "12345678900",
        dataNascimento: "1990-01-01",
        endereco: {
          cep: "01310100",
          rua: "Avenida Paulista",
          numero: "1000",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          estado: "SP",
        },
      });

      console.log("🎯 [TESTE SQUAD 18] Resultado:", result);
      setResultado(result);

      if (result.success) {
        toast.success("✅ Paciente SQUAD 18 cadastrado com sucesso na API!");
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      console.error("💥 [TESTE SQUAD 18] Erro:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      setResultado({ success: false, error: errorMessage });
      toast.error("Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Teste de Cadastro SQUAD 18
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Dados do Teste:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✉️ Email: teste.squad18@clinica.com</li>
            <li>👤 Nome: Paciente Teste SQUAD 18</li>
            <li>🔑 Senha: 123456</li>
            <li>📞 Telefone: 11999998888</li>
            <li>📍 Endpoint: /auth/v1/signup</li>
          </ul>
        </div>

        <button
          onClick={handleTestar}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg mb-6"
        >
          {loading ? "⏳ Testando..." : "🚀 Executar Teste de Cadastro"}
        </button>

        {resultado && (
          <div
            className={`rounded-lg p-6 ${
              resultado.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3
              className={`font-bold text-lg mb-3 ${
                resultado.success ? "text-green-900" : "text-red-900"
              }`}
            >
              {resultado.success ? "✅ SUCESSO!" : "❌ ERRO"}
            </h3>
            <pre className="text-sm overflow-auto bg-white p-4 rounded border">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Voltar para Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default TesteCadastroSquad18;
