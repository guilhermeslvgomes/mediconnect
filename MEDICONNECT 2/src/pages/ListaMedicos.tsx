import React, { useEffect, useState } from "react";
import AvatarInitials from "../components/AvatarInitials";
import { Stethoscope, Mail, Phone, AlertTriangle } from "lucide-react";
import medicoService, { MedicoDetalhado } from "../services/medicoService";

const ListaMedicos: React.FC = () => {
  const [medicos, setMedicos] = useState<MedicoDetalhado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await medicoService.listarMedicos({ status: "ativo" });
        if (!resp.success) {
          if (!cancelled) {
            setError(resp.error || "Falha ao carregar médicos");
            setMedicos([]);
          }
          return;
        }
        const list = resp.data?.data || [];
        if (!list.length) {
          console.warn(
            '[ListaMedicos] Nenhum médico retornado. Verifique se a tabela "doctors" possui registros e se as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY apontam para produção.'
          );
        }
        if (!cancelled) setMedicos(list);
      } catch (e) {
        console.error("Erro inesperado ao listar médicos", e);
        if (!cancelled) {
          setError("Erro inesperado ao listar médicos");
          setMedicos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold">Médicos Cadastrados</h2>
      </div>

      {loading && <div className="text-gray-500">Carregando médicos...</div>}

      {!loading && error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && medicos.length === 0 && (
        <div className="text-gray-500">Nenhum médico cadastrado.</div>
      )}

      {!loading && !error && medicos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicos.map((medico) => (
            <article
              key={medico.id}
              className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              tabIndex={0}
            >
              <header className="flex items-center gap-2">
                {medico.avatar_url ? (
                  <img
                    src={medico.avatar_url}
                    alt={medico.nome}
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <AvatarInitials name={medico.nome} size={40} />
                )}
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-lg text-gray-900">
                  {medico.nome}
                </h3>
              </header>
              <div className="text-sm text-gray-700">
                <strong>Especialidade:</strong> {medico.especialidade}
              </div>
              <div className="text-sm text-gray-700">
                <strong>CRM:</strong> {medico.crm}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4" /> {medico.email}
              </div>
              {medico.telefone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4" /> {medico.telefone}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaMedicos;
