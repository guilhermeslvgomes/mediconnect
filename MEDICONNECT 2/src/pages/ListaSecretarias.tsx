import React, { useEffect, useState } from "react";
import { UserPlus, Mail, Phone } from "lucide-react";

interface Secretaria {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  criadoEm: string;
}

const ListaSecretarias: React.FC = () => {
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);

  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("secretarias") || "[]");
    setSecretarias(lista);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-green-600" /> Secretárias Cadastradas
      </h2>
      {secretarias.length === 0 ? (
        <div className="text-gray-500">Nenhuma secretária cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secretarias.map((sec, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-6 flex flex-col gap-2 transition-colors border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
              tabIndex={0}
            >
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-lg">{sec.nome}</span>
              </div>
              <div className="text-sm text-gray-700">
                <strong>CPF:</strong> {sec.cpf}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4" /> {sec.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4" /> {sec.telefone}
              </div>
              <div className="text-xs text-gray-500">
                Cadastrada em: {new Date(sec.criadoEm).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaSecretarias;
