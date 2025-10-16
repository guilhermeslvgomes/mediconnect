import React from "react";
import { AvatarInitials } from "../AvatarInitials";
import { Calendar, Eye, Pencil, Trash2 } from "lucide-react";

export interface PatientListItem {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefoneFormatado?: string; // já formatado externamente
  convenio?: string | null;
  vip?: boolean;
  cidade?: string;
  estado?: string;
  ultimoAtendimento?: string | null; // ISO ou texto humanizado
  proximoAtendimento?: string | null;
  avatar_url?: string;
}

interface PatientListTableProps {
  pacientes: PatientListItem[];
  onEdit: (paciente: PatientListItem) => void;
  onDelete: (paciente: PatientListItem) => void;
  onView?: (paciente: PatientListItem) => void;
  onSchedule?: (paciente: PatientListItem) => void;
  emptyMessage?: string;
}

const PatientListTable: React.FC<PatientListTableProps> = ({
  pacientes,
  onEdit,
  onDelete,
  onView,
  onSchedule,
  emptyMessage = "Nenhum paciente encontrado.",
}) => {
  return (
    <div
      className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
      role="region"
      aria-label="Lista de pacientes"
    >
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        role="table"
      >
        <thead
          className="bg-gray-50/90 dark:bg-gray-800/90 sticky top-0 backdrop-blur supports-[backdrop-filter]:backdrop-blur z-10"
          role="rowgroup"
        >
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Paciente
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Contato
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Local
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Último Atendimento
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Próximo Atendimento
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Convênio
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Ações
            </th>
          </tr>
        </thead>
        <tbody
          className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          role="rowgroup"
        >
          {pacientes.map((p) => (
            <tr
              key={p.id}
              className="bg-white dark:bg-gray-900 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-colors"
              role="row"
            >
              <td className="px-6 py-4">
                <div className="flex items-start gap-3">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.nome}
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  ) : (
                    <AvatarInitials name={p.nome} size={40} />
                  )}
                  <div>
                    <div
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
                      onClick={() => onView?.(p)}
                    >
                      {p.nome || "Sem nome"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {p.cpf || "CPF não informado"}
                    </div>
                    {p.vip && (
                      <div
                        className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 ring-1 ring-yellow-700/20 dark:bg-yellow-200 dark:text-yellow-900"
                        aria-label="Paciente VIP"
                      >
                        <span aria-hidden>★</span> VIP
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="text-gray-900 dark:text-gray-100">
                  {p.email || "Não informado"}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {p.telefoneFormatado || "Telefone não informado"}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {p.cidade || p.estado
                  ? `${p.cidade || ""}${p.cidade && p.estado ? "/" : ""}${
                      p.estado || ""
                    }`
                  : "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {p.ultimoAtendimento || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {p.proximoAtendimento || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {p.convenio || "Particular"}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(p)}
                      title={`Ver ${p.nome}`}
                      aria-label={`Ver ${p.nome}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                  )}
                  {onSchedule && (
                    <button
                      onClick={() => onSchedule(p)}
                      title={`Agendar para ${p.nome}`}
                      aria-label={`Agendar para ${p.nome}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Agendar</span>
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(p)}
                    title={`Editar ${p.nome}`}
                    aria-label={`Editar ${p.nome}`}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    title={`Excluir ${p.nome}`}
                    aria-label={`Excluir ${p.nome}`}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {pacientes.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                <span role="status" aria-live="polite">
                  {emptyMessage}
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PatientListTable;
