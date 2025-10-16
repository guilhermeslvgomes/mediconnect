import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  Video,
  MapPin,
  Phone,
  FileText,
  Settings,
  LogOut,
  Home,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import consultasService, {
  Consulta as ServiceConsulta,
} from "../services/consultasService";
import { listPatients } from "../services/pacienteService";
import { useAuth } from "../hooks/useAuth";
import relatorioService, {
  RelatorioCreate,
} from "../services/relatorioService";
import DisponibilidadeMedico from "../components/DisponibilidadeMedico";
import ConsultaModal from "../components/consultas/ConsultaModal";

interface ConsultaUI {
  id: string;
  pacienteId: string;
  medicoId: string;
  pacienteNome: string;
  medicoNome: string;
  dataHora: string;
  status: string;
  tipo?: string;
  observacoes?: string;
}

const PainelMedico: React.FC = () => {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  // Auth
  const temAcessoMedico =
    user &&
    (user.role === "medico" ||
      roles.includes("medico") ||
      roles.includes("admin"));
  const medicoId = temAcessoMedico ? user.id : "";
  const medicoNome = user?.nome || "Médico";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatar_url || null
  );
  const [avatarEditMode, setAvatarEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Função para buscar avatar público
  const fetchAvatarUrl = useCallback(() => {
    if (!user?.id) return;
    // Tenta jpg, png, webp
    const base = `https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/public/avatars/${user.id}/avatar`;
    const tryExts = async () => {
      for (const ext of ["jpg", "png", "webp"]) {
        const url = `${base}.${ext}`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (res.ok) {
            setAvatarUrl(url);
            return;
          }
        } catch {}
      }
      setAvatarUrl(null);
    };
    tryExts();
  }, [user?.id]);

  useEffect(() => {
    fetchAvatarUrl();
  }, [fetchAvatarUrl]);

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.id) return;
    const formData = new FormData();
    formData.append("file", avatarFile);
    await fetch(
      `https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/avatars/${user.id}/avatar`,
      {
        method: "POST",
        body: formData,
      }
    );
    // Atualiza avatar_url no perfil
    const ext = avatarFile.name.split(".").pop();
    const publicUrl = `https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/public/avatars/${user.id}/avatar.${ext}`;
    await fetch(
      `https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      }
    );
    setAvatarEditMode(false);
    setAvatarFile(null);
    setAvatarUrl(publicUrl);
  };

  // Remover avatar
  const handleAvatarRemove = async () => {
    if (!user?.id) return;
    await fetch(
      `https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/avatars/${user.id}/avatar`,
      {
        method: "DELETE",
      }
    );
    await fetch(
      `https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: null }),
      }
    );
    setAvatarUrl(null);
  };

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [consultas, setConsultas] = useState<ConsultaUI[]>([]);
  const [filtroData, setFiltroData] = useState("hoje");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConsultaUI | null>(null);
  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [pacientesDisponiveis, setPacientesDisponiveis] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [formRelatorio, setFormRelatorio] = useState({
    patient_id: "",
    order_number: "",
    exam: "",
    diagnosis: "",
    conclusion: "",
    cid_code: "",
    content_html: "",
    status: "draft" as "draft" | "pending" | "completed" | "cancelled",
    requested_by: medicoNome,
    due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    hide_date: false,
    hide_signature: false,
  });

  useEffect(() => {
    if (!medicoId) navigate("/login-medico");
  }, [medicoId, navigate]);

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    try {
      let resp;
      if (user?.role === "admin" || roles.includes("admin")) {
        // Admin: busca todas as consultas do sistema
        resp = await consultasService.listarTodas();
      } else {
        // Médico comum: busca todas as consultas do próprio médico
        if (!medicoId) return;
        resp = await consultasService.listarPorMedico(medicoId);
      }
      if (resp && resp.success && resp.data) {
        // Buscar nomes dos pacientes usando getPatientById
        const { getPatientById } = await import("../services/pacienteService");
        const consultasComNomes = await Promise.all(
          resp.data.map(async (c) => {
            let pacienteNome = "Paciente Desconhecido";
            try {
              const pacienteResp = await getPatientById(c.pacienteId);
              if (pacienteResp.success && pacienteResp.data) {
                pacienteNome = pacienteResp.data.nome;
              }
            } catch (error) {
              console.error("Erro ao buscar nome do paciente:", error);
            }
            return {
              id: c.id,
              pacienteId: c.pacienteId,
              medicoId: c.medicoId,
              pacienteNome,
              medicoNome: medicoNome,
              dataHora: c.dataHora,
              status: c.status,
              tipo: c.tipo,
              observacoes: c.observacoes,
            };
          })
        );
        setConsultas(consultasComNomes);
      } else {
        setConsultas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      toast.error("Erro ao carregar consultas");
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }, [user, roles, medicoId, medicoNome]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  useEffect(() => {
    if (relatorioModalOpen && user?.id) {
      const carregarPacientes = async () => {
        try {
          const response = await listPatients({ per_page: 200 });
          if ("data" in response) {
            setPacientesDisponiveis(
              response.data.map((p) => ({
                id: p.id,
                nome: p.nome,
              }))
            );
          }
        } catch (error) {
          console.error("Erro ao carregar pacientes:", error);
          toast.error("Erro ao carregar lista de pacientes");
        }
      };
      carregarPacientes();
    }
  }, [relatorioModalOpen, user]);

  const handleCriarRelatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRelatorio.patient_id) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!formRelatorio.exam.trim()) {
      toast.error("Informe o tipo de exame");
      return;
    }
    setLoadingRelatorio(true);
    try {
      const payload: RelatorioCreate = {
        patient_id: formRelatorio.patient_id,
        order_number: formRelatorio.order_number || "",
        exam: formRelatorio.exam,
        diagnosis: formRelatorio.diagnosis || "",
        conclusion: formRelatorio.conclusion || "",
        cid_code: formRelatorio.cid_code || "",
        content_html: formRelatorio.content_html || "",
        status: formRelatorio.status,
        requested_by: formRelatorio.requested_by || medicoNome,
        due_at: formRelatorio.due_at || "",
        hide_date: formRelatorio.hide_date,
        hide_signature: formRelatorio.hide_signature,
      };
      const resp = await relatorioService.criarRelatorio(payload);
      if (resp.success) {
        toast.success("Relatório criado com sucesso!");
        setRelatorioModalOpen(false);
        setFormRelatorio({
          patient_id: "",
          order_number: "",
          exam: "",
          diagnosis: "",
          conclusion: "",
          cid_code: "",
          content_html: "",
          status: "draft",
          requested_by: medicoNome,
          due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          hide_date: false,
          hide_signature: false,
        });
      } else {
        toast.error(resp.error || "Erro ao criar relatório");
      }
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      toast.error("Erro ao criar relatório");
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const handleNovaConsulta = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditConsulta = (consulta: ConsultaUI) => {
    setEditing(consulta);
    setModalOpen(true);
  };

  const handleDeleteConsulta = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta consulta?")) return;
    try {
      const raw = localStorage.getItem("consultas_local");
      if (raw) {
        const lista: ServiceConsulta[] = JSON.parse(raw);
        const nova = lista.filter((c) => c.id !== id);
        localStorage.setItem("consultas_local", JSON.stringify(nova));
        toast.success("Consulta excluída");
        fetchConsultas();
      }
    } catch (error) {
      console.error("Erro ao excluir consulta:", error);
      toast.error("Erro ao excluir consulta");
    }
  };

  const handleSaveConsulta = () => {
    setModalOpen(false);
    setEditing(null);
    fetchConsultas();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmada":
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "agendada":
      case "scheduled":
        return "bg-indigo-100 text-indigo-800 border-blue-200 dark:bg-indigo-900/30 dark:text-blue-300 dark:border-indigo-800";
      case "concluida":
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800";
      case "cancelada":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmada":
      case "confirmed":
        return "Confirmada";
      case "agendada":
      case "scheduled":
        return "Agendada";
      case "concluida":
      case "completed":
        return "Concluída";
      case "cancelada":
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmada":
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "agendada":
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "cancelada":
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Stats
  // Exibe todas as consultas do médico logado, sem filtro extra
  const consultasHoje = consultas;
  const consultasConfirmadas = consultas.filter(
    (c) =>
      c.status.toLowerCase() === "confirmada" ||
      c.status.toLowerCase() === "confirmed"
  );
  const consultasConcluidas = consultas.filter(
    (c) =>
      c.status.toLowerCase() === "concluida" ||
      c.status.toLowerCase() === "completed"
  );

  // Sidebar
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "appointments", label: "Consultas", icon: Clock },
    { id: "availability", label: "Disponibilidade", icon: Calendar },
    { id: "reports", label: "Relatórios", icon: FileText },
    { id: "help", label: "Ajuda", icon: HelpCircle },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const renderSidebar = () => (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Doctor Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-14 w-14 rounded-full object-cover border shadow"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow">
                {medicoNome
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 border shadow group-hover:bg-indigo-100 transition"
              title="Editar avatar"
              onClick={() => setAvatarEditMode(true)}
              style={{ lineHeight: 0 }}
            >
              <Pencil size={16} className="text-indigo-600" />
            </button>
            {avatarEditMode && (
              <form
                className="absolute top-0 left-16 bg-white p-2 rounded shadow z-10 flex flex-col items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAvatarUpload();
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="mb-2"
                />
                <button
                  type="submit"
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  className="text-xs ml-2"
                  onClick={() => setAvatarEditMode(false)}
                >
                  Cancelar
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className="text-xs text-red-600 underline mt-2"
                    onClick={handleAvatarRemove}
                  >
                    Remover
                  </button>
                )}
              </form>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {medicoNome}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Médico</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "help") {
                    navigate("/ajuda");
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => {
            logout();
            navigate("/login-medico");
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );

  // Stats Cards
  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ElementType,
    description?: string,
    trend?: string
  ) => {
    const Icon = icon;
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {trend && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{trend}</p>
        )}
      </div>
    );
  };

  // Appointment Card
  const renderAppointmentCard = (consulta: ConsultaUI) => (
    <div
      key={consulta.id}
      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
        {consulta.pacienteNome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {consulta.pacienteNome}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {consulta.observacoes || "Consulta médica"}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
              consulta.status
            )}`}
          >
            {getStatusIcon(consulta.status)}
            {getStatusLabel(consulta.status)}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(consulta.dataHora), "HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {consulta.tipo === "online" || consulta.tipo === "telemedicina" ? (
              <>
                <Video className="h-4 w-4" />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Presencial</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {consulta.status.toLowerCase() === "confirmada" && (
            <>
              <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <Phone className="h-4 w-4" />
                Ligar
              </button>
              {(consulta.tipo === "online" ||
                consulta.tipo === "telemedicina") && (
                <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  <Video className="h-4 w-4" />
                  Iniciar Consulta
                </button>
              )}
            </>
          )}
          <button
            onClick={() => handleEditConsulta(consulta)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={() => handleDeleteConsulta(consulta.id)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );

  // Content Sections
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard(
          "Consultas Hoje",
          consultasHoje.length,
          Clock,
          `${consultasConfirmadas.length} confirmadas`
        )}
        {renderStatCard(
          "Total Consultas",
          consultas.length,
          Calendar,
          "Este período"
        )}
        {renderStatCard(
          "Concluídas",
          consultasConcluidas.length,
          CheckCircle,
          "Este período"
        )}
        {renderStatCard(
          "Taxa Comparecimento",
          consultas.length > 0
            ? `${Math.round(
                (consultasConcluidas.length / consultas.length) * 100
              )}%`
            : "0%",
          TrendingUp,
          "Baseado em consultas concluídas"
        )}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Consultas de Hoje
            </h2>
            <button
              onClick={handleNovaConsulta}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Nova Consulta
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Carregando consultas...
              </p>
            </div>
          ) : consultasHoje.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Nenhuma consulta agendada para hoje
            </p>
          ) : (
            <div className="space-y-4">
              {consultasHoje.map(renderAppointmentCard)}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Próximos 7 Dias
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Segunda-feira
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  0 consultas
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Terça-feira
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  0 consultas
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Quarta-feira
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  0 consultas
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Tipos de Consulta
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Presencial
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {
                    consultas.filter(
                      (c) => c.tipo !== "online" && c.tipo !== "telemedicina"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Online
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {
                    consultas.filter(
                      (c) => c.tipo === "online" || c.tipo === "telemedicina"
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Todas as Consultas
        </h1>
        <button
          onClick={handleNovaConsulta}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Nova Consulta
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["hoje", "amanha", "semana", "todas"].map((filtro) => (
          <button
            key={filtro}
            onClick={() => setFiltroData(filtro)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              filtroData === filtro
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            {filtro === "hoje"
              ? "Hoje"
              : filtro === "amanha"
              ? "Amanhã"
              : filtro === "semana"
              ? "Esta Semana"
              : "Todas"}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Carregando consultas...
              </p>
            </div>
          ) : consultas.length === 0 ? (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              Nenhuma consulta encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {consultas.map(renderAppointmentCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => <DisponibilidadeMedico />;

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h1>
        <button
          onClick={() => setRelatorioModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Novo Relatório
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6">
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            Funcionalidade em desenvolvimento
          </p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Configurações
      </h1>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6">
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            Funcionalidade em desenvolvimento
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "appointments":
        return renderAppointments();
      case "availability":
        return renderAvailability();
      case "reports":
        return renderReports();
      case "settings":
        return renderSettings();
      default:
        return null;
    }
  };

  if (!temAcessoMedico) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => navigate("/login-medico")}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">{renderContent()}</div>
      </main>

      {/* Modals */}
      {modalOpen && (
        <ConsultaModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaveConsulta}
          editing={editing}
          defaultMedicoId={medicoId}
          lockMedico={false}
        />
      )}

      {relatorioModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setRelatorioModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Criar Novo Relatório
              </h2>
            </div>
            <form onSubmit={handleCriarRelatorio} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paciente *
                </label>
                <select
                  value={formRelatorio.patient_id}
                  onChange={(e) =>
                    setFormRelatorio((p) => ({
                      ...p,
                      patient_id: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione um paciente</option>
                  {pacientesDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Exame *
                </label>
                <input
                  type="text"
                  value={formRelatorio.exam}
                  onChange={(e) =>
                    setFormRelatorio((p) => ({ ...p, exam: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  value={formRelatorio.diagnosis}
                  onChange={(e) =>
                    setFormRelatorio((p) => ({
                      ...p,
                      diagnosis: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Conclusão
                </label>
                <textarea
                  value={formRelatorio.conclusion}
                  onChange={(e) =>
                    setFormRelatorio((p) => ({
                      ...p,
                      conclusion: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRelatorioModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingRelatorio}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {loadingRelatorio ? "Criando..." : "Criar Relatório"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelMedico;
