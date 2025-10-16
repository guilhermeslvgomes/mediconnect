import React, { useEffect, useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import consultasService, {
  Consulta,
  ConsultaCreate,
  ConsultaUpdate,
} from "../../services/consultasService";
import { listPatients, Paciente } from "../../services/pacienteService";
import { medicoService, Medico } from "../../services/medicoService";
import { useAuth } from "../../hooks/useAuth";

interface ConsultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (c: Consulta) => void;
  editing?: Consulta | null;
  defaultPacienteId?: string;
  defaultMedicoId?: string;
  lockPaciente?: boolean; // quando abrir a partir do prontuário
  lockMedico?: boolean; // quando médico logado não deve mudar
}

const TIPO_SUGESTOES = [
  "Primeira consulta",
  "Retorno",
  "Acompanhamento",
  "Exame",
  "Telemedicina",
];

const ConsultaModal: React.FC<ConsultaModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editing,
  defaultPacienteId,
  defaultMedicoId,
  lockPaciente = false,
  lockMedico = false,
}) => {
  const { user } = useAuth();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [pacienteId, setPacienteId] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [dataHora, setDataHora] = useState(""); // value for datetime-local
  const [tipo, setTipo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<string>("agendada");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load supporting lists
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        setLoadingLists(true);
        const [pacsResp, medsResp] = await Promise.all([
          listPatients().catch(() => ({
            data: [],
            total: 0,
            page: 1,
            per_page: 0,
          })),
          medicoService
            .listarMedicos()
            .catch(() => ({ success: false, data: undefined })),
        ]);
        if (!active) return;
        setPacientes(pacsResp.data);
        if (medsResp && medsResp.success && medsResp.data) {
          setMedicos(medsResp.data.data);
        }
      } finally {
        if (active) setLoadingLists(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Initialize form when opening / editing changes
  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setPacienteId(editing.pacienteId);
      setMedicoId(editing.medicoId);
      // Convert ISO to local datetime-local value
      try {
        const d = new Date(editing.dataHora);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDataHora(local);
      } catch {
        setDataHora("");
      }
      setTipo(editing.tipo || "");
      setMotivo(editing.motivo || "");
      setObservacoes(editing.observacoes || "");
      setStatus(editing.status || "agendada");
    } else {
      setPacienteId(defaultPacienteId || "");
      setMedicoId(defaultMedicoId || "");
      setDataHora("");
      setTipo("");
      setMotivo("");
      setObservacoes("");
      setStatus("agendada");
    }
    setError(null);
    setSaving(false);
  }, [isOpen, editing, defaultPacienteId, defaultMedicoId, user]);

  const closeOnEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [isOpen, closeOnEsc]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!pacienteId) {
      setError("Selecione um paciente.");
      return false;
    }
    if (!medicoId) {
      setError("Selecione um médico.");
      return false;
    }
    if (!dataHora) {
      setError("Informe data e hora.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      // Convert local datetime back to ISO
      const iso = new Date(dataHora).toISOString();
      if (editing) {
        const payload: ConsultaUpdate = {
          dataHora: iso,
          tipo: tipo || undefined,
          motivo: motivo || undefined,
          observacoes: observacoes || undefined,
          status: status,
        };
        const resp = await consultasService.atualizar(editing.id, payload);
        if (!resp.success || !resp.data) {
          throw new Error(resp.error || "Falha ao atualizar consulta");
        }
        onSaved(resp.data);
      } else {
        const payload: ConsultaCreate = {
          pacienteId,
          medicoId,
          dataHora: iso,
          tipo: tipo || undefined,
          motivo: motivo || undefined,
          observacoes: observacoes || undefined,
        };
        const resp = await consultasService.criar(payload);
        if (!resp.success || !resp.data) {
          throw new Error(resp.error || "Falha ao criar consulta");
        }
        onSaved(resp.data);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const title = editing ? "Editar Consulta" : "Nova Consulta";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl animate-fade-in mt-10">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente
              </label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                disabled={lockPaciente || !!editing}
              >
                <option value="">Selecione...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Médico
              </label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value)}
                disabled={lockMedico || !!editing}
              >
                <option value="">Selecione...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} - {m.especialidade}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data / Hora
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded px-2 py-2 text-sm"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <input
                list="tipos-consulta"
                className="w-full border rounded px-2 py-2 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Retorno"
              />
              <datalist id="tipos-consulta">
                {TIPO_SUGESTOES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input
                className="w-full border rounded px-2 py-2 text-sm"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo principal"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                className="w-full border rounded px-2 py-2 text-sm resize-y min-h-[80px]"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas internas, preparação, etc"
              />
            </div>
            {editing && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border rounded px-2 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="agendada">Agendada</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="realizada">Realizada</option>
                  <option value="faltou">Faltou</option>
                </select>
              </div>
            )}
          </div>
          {loadingLists && (
            <p className="text-xs text-gray-500 flex items-center">
              <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Carregando
              listas...
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{" "}
              {editing ? "Salvar alterações" : "Criar consulta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultaModal;
