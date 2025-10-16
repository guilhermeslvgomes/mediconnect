import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { availabilityService } from "../../services";
import type {
  DoctorAvailability,
  Weekday,
  AppointmentType,
} from "../../services/availabilityService";

interface Props {
  doctorId: string;
}

const WEEKDAYS: Weekday[] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

const AvailabilityManager: React.FC<Props> = ({ doctorId }) => {
  const [list, setList] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    weekday: "segunda" as Weekday,
    start_time: "09:00:00",
    end_time: "17:00:00",
    slot_minutes: 30,
    appointment_type: "presencial" as AppointmentType,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return (
      !!doctorId &&
      !!form.weekday &&
      !!form.start_time &&
      !!form.end_time &&
      Number(form.slot_minutes) > 0
    );
  }, [doctorId, form]);

  async function load() {
    if (!doctorId) return;
    setLoading(true);
    const res = await availabilityService.listDoctorActiveAvailability(
      doctorId
    );
    if (res.success && res.data) setList(res.data);
    else toast.error(res.error || "Erro ao carregar disponibilidades");
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  async function addAvailability(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar formato de tempo
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(form.start_time) || !timeRegex.test(form.end_time)) {
      toast.error("Formato de horário inválido. Use HH:MM:SS");
      return;
    }

    // Validar que o horário de fim é depois do início
    if (form.start_time >= form.end_time) {
      toast.error("Horário de fim deve ser posterior ao horário de início");
      return;
    }

    const payload = {
      doctor_id: doctorId,
      weekday: form.weekday,
      start_time: form.start_time,
      end_time: form.end_time,
      slot_minutes: Number(form.slot_minutes) || 30,
      appointment_type: form.appointment_type,
      active: form.active,
    };

    console.log("[AvailabilityManager] Enviando payload:", payload);

    setSaving(true);
    const res = await availabilityService.createAvailability(payload);
    setSaving(false);

    if (res.success) {
      toast.success("Disponibilidade criada com sucesso!");
      setForm((f) => ({ ...f, start_time: "09:00:00", end_time: "17:00:00" }));
      void load();
    } else {
      console.error("[AvailabilityManager] Erro ao criar:", res.error);
      toast.error(res.error || "Falha ao criar disponibilidade");
    }
  }

  async function toggleActive(item: DoctorAvailability) {
    if (!item.id) return;
    const res = await availabilityService.updateAvailability(item.id, {
      active: !item.active,
    });
    if (res.success) {
      toast.success("Atualizado");
      void load();
    } else toast.error(res.error || "Falha ao atualizar");
  }

  async function remove(item: DoctorAvailability) {
    if (!item.id) return;
    const ok = confirm("Remover disponibilidade?");
    if (!ok) return;
    const res = await availabilityService.deleteAvailability(item.id);
    if (res.success) {
      toast.success("Removido");
      void load();
    } else toast.error(res.error || "Falha ao remover");
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      {/* Título mais destacado para leitura escaneável */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Disponibilidade Semanal
      </h3>
      <form onSubmit={addAvailability} className="mb-6">
        {/* Grid responsivo com espaçamento consistente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Dia da Semana
            </label>
            <select
              value={form.weekday}
              onChange={(e) =>
                setForm((f) => ({ ...f, weekday: e.target.value as Weekday }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Horário Início
            </label>
            <input
              type="time"
              step={60}
              value={form.start_time?.slice(0, 5)}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_time: `${e.target.value}:00` }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Horário Fim
            </label>
            <input
              type="time"
              step={60}
              value={form.end_time?.slice(0, 5)}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_time: `${e.target.value}:00` }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Duração (min)
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.slot_minutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, slot_minutes: Number(e.target.value) }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Tipo Atendimento
            </label>
            <select
              value={form.appointment_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  appointment_type: e.target.value as AppointmentType,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
            >
              <option value="presencial">Presencial</option>
              <option value="telemedicina">Telemedicina</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={!canSave || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {saving ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          Nenhuma disponibilidade cadastrada. Use o formulário acima para
          adicionar horários.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dia da Semana
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário Início
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário Fim
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list.map((item) => (
                <tr
                  key={item.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.weekday
                      ? item.weekday.charAt(0).toUpperCase() +
                        item.weekday.slice(1)
                      : "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.start_time?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.end_time?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.slot_minutes || 30} min
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.appointment_type === "presencial"
                      ? "Presencial"
                      : "Telemedicina"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.active
                          ? "bg-green-100 text-green-800 ring-1 ring-green-600/20 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 ring-1 ring-gray-600/20 hover:bg-gray-200"
                      }`}
                      onClick={() => void toggleActive(item)}
                    >
                      {item.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => void remove(item)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;
