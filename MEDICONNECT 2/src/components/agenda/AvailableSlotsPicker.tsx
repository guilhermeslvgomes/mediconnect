import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { appointmentService } from "../../services";

interface Props {
  doctorId: string;
  date: string; // YYYY-MM-DD
  onSelect: (time: string) => void; // HH:MM
  appointment_type?: "presencial" | "telemedicina";
}

const AvailableSlotsPicker: React.FC<Props> = ({
  doctorId,
  date,
  onSelect,
  appointment_type,
}) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    if (!date) return null;
    const start = new Date(`${date}T00:00:00Z`).toISOString();
    const end = new Date(`${date}T23:59:59Z`).toISOString();
    return { start, end };
  }, [date]);

  useEffect(() => {
    async function fetchSlots() {
      if (!doctorId || !range) return;
      setLoading(true);
      const res = await appointmentService.getAvailableSlots({
        doctor_id: doctorId,
        start_date: range.start,
        end_date: range.end,
        appointment_type,
      });
      setLoading(false);
      if (res.success && res.data) {
        const times = res.data.slots
          .filter((s) => s.available)
          .map((s) => s.datetime.slice(11, 16));
        setSlots(times);
      } else {
        toast.error(res.error || "Erro ao buscar horários");
      }
    }
    void fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date, appointment_type]);

  if (!date || !doctorId) return null;

  if (loading)
    return <div className="text-sm text-gray-500">Carregando horários...</div>;

  if (!slots.length)
    return (
      <div className="text-sm text-gray-500">
        Nenhum horário disponível para a data selecionada.
      </div>
    );

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {slots.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className="px-3 py-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm"
        >
          {t}
        </button>
      ))}
    </div>
  );
};

export default AvailableSlotsPicker;
