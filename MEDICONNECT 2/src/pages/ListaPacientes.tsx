import React, { useEffect, useState } from "react";
import AvatarInitials from "../components/AvatarInitials";
// Funções utilitárias para formatação
function formatCPF(cpf?: string) {
  if (!cpf) return "Não informado";
  const v = cpf.replace(/\D/g, "").slice(0, 11);
  if (v.length !== 11) return cpf;
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone?: string) {
  if (!phone) return "Não informado";
  let v = phone.replace(/\D/g, "");
  if (v.length < 10) return phone;
  v = v.slice(0, 13);
  v = "+55 " + v;
  v = v.replace(/(\+55 )(\d{2})(\d)/, "$1$2 $3");
  v = v.replace(/(\+55 \d{2} )(\d{5})(\d{1,4})/, "$1$2-$3");
  return v;
}

function formatEmail(email?: string) {
  if (!email) return "Não informado";
  return email.trim().toLowerCase();
}
import { Users, Mail, Phone } from "lucide-react";
import {
  listPatients,
  type Paciente as PacienteApi,
} from "../services/pacienteService";

type Paciente = PacienteApi;

const ListaPacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await listPatients();
        const items = resp.data;
        if (!items.length) {
          console.warn(
            '[ListaPacientes] Nenhum paciente retornado. Verifique se a tabela "patients" possui registros ou se variáveis VITE_SUPABASE_URL / KEY apontam para produção. fromCache=',
            resp.fromCache
          );
        }
        setPacientes(items as Paciente[]);
      } catch (e) {
        console.error("Erro ao listar pacientes", e);
        setError("Falha ao carregar pacientes");
        setPacientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" /> Pacientes Cadastrados
      </h2>
      {loading && <div className="text-gray-500">Carregando pacientes...</div>}
      {!loading && error && (
        <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
          {error}
        </div>
      )}
      {!loading && !error && pacientes.length === 0 && (
        <div className="text-gray-500">Nenhum paciente cadastrado.</div>
      )}
      {!loading && !error && pacientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacientes.map((paciente, idx) => (
            <div
              key={paciente.id}
              className={`rounded-lg p-6 flex flex-col gap-2 transition-colors border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
              tabIndex={0}
            >
              <div className="flex items-center gap-2 mb-2">
                {paciente.avatar_url ? (
                  <img
                    src={paciente.avatar_url}
                    alt={paciente.nome}
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                ) : (
                  <AvatarInitials name={paciente.nome} size={40} />
                )}
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-lg">{paciente.nome}</span>
              </div>
              <div className="text-sm text-gray-700">
                <strong>CPF:</strong> {formatCPF(paciente.cpf)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4" /> {formatEmail(paciente.email)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4" /> {formatPhone(paciente.telefone)}
              </div>
              <div className="text-xs text-gray-500">
                Nascimento:{" "}
                {paciente.dataNascimento
                  ? new Date(paciente.dataNascimento).toLocaleDateString()
                  : "Não informado"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaPacientes;
