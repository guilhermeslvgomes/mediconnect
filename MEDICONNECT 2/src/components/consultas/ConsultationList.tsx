import React from "react";
import { Loader2, Check, X, CalendarCheck, Pencil, Trash2 } from "lucide-react";

export interface ConsultationListItem {
  id: string;
  dataHora: string; // ISO
  pacienteNome?: string;
  medicoNome?: string;
  tipo?: string;
  status: string; // agendada | confirmada | cancelada | realizada | faltou
  observacoes?: string;
}

export interface ConsultationListProps {
  itens: ConsultationListItem[];
  loading?: boolean;
  showPaciente?: boolean;
  showMedico?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowStatusChange?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: string) => void;
  onSelect?: (id: string) => void;
}

const statusConfig: Record<
  string,
  { label: string; className: string; next?: string[] }
> = {
  agendada: {
    label: "Agendada",
    className: "bg-blue-100 text-blue-800",
    next: ["confirmada", "cancelada"],
  },
  confirmada: {
    label: "Confirmada",
    className: "bg-green-100 text-green-800",
    next: ["realizada", "cancelada"],
  },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800" },
  realizada: { label: "Realizada", className: "bg-gray-100 text-gray-800" },
  faltou: { label: "Faltou", className: "bg-yellow-100 text-yellow-800" },
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

const ConsultationList: React.FC<ConsultationListProps> = ({
  itens,
  loading = false,
  showPaciente = true,
  showMedico = true,
  allowEdit = true,
  allowDelete = true,
  allowStatusChange = true,
  compact = false,
  emptyMessage = "Nenhuma consulta encontrada.",
  onEdit,
  onDelete,
  onChangeStatus,
  onSelect,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data/Hora
            </th>
            {showPaciente && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
            )}
            {showMedico && (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médico
              </th>
            )}
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />{" "}
                Carregando consultas...
              </td>
            </tr>
          )}
          {!loading && itens.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            itens.map((c) => {
              const s = statusConfig[c.status] || {
                label: c.status,
                className: "bg-gray-100 text-gray-800",
              };
              return (
                <tr
                  key={c.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onSelect?.(c.id)}
                      className="text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
                    >
                      {formatDateTime(c.dataHora)}
                    </button>
                    {!compact && c.observacoes && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {c.observacoes}
                      </p>
                    )}
                  </td>
                  {showPaciente && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.pacienteNome || "—"}
                    </td>
                  )}
                  {showMedico && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {c.medicoNome || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.tipo || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${s.className
                        .replace("bg-", "bg-")
                        .replace("text-", "text-")}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    {allowStatusChange &&
                      s.next &&
                      s.next.includes("confirmada") &&
                      c.status === "agendada" && (
                        <button
                          onClick={() => onChangeStatus?.(c.id, "confirmada")}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Check className="w-4 h-4 mr-1" /> Confirmar
                        </button>
                      )}
                    {allowStatusChange && c.status === "confirmada" && (
                      <button
                        onClick={() => onChangeStatus?.(c.id, "realizada")}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <CalendarCheck className="w-4 h-4 mr-1" /> Realizar
                      </button>
                    )}
                    {allowStatusChange &&
                      ["agendada", "confirmada"].includes(c.status) && (
                        <button
                          onClick={() => onChangeStatus?.(c.id, "cancelada")}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <X className="w-4 h-4 mr-1" /> Cancelar
                        </button>
                      )}
                    {allowEdit && (
                      <button
                        onClick={() => onEdit?.(c.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-gray-700 bg-gray-50 hover:bg-gray-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Editar
                      </button>
                    )}
                    {allowDelete && (
                      <button
                        onClick={() => onDelete?.(c.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-gray-700 hover:text-red-700 bg-gray-50 hover:bg-red-50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultationList;
