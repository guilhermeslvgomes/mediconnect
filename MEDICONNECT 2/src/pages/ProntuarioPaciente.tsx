import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { consultasService, type Consulta } from "../services/consultasService";
import {
  getPatientById,
  listPatientAttachments,
  addPatientAttachment,
  removePatientAttachment,
  type Paciente as PacienteServiceModel,
  type Anexo,
} from "../services/pacienteService";

interface ExtendedPacienteMeta {
  rg?: string;
  estado_civil?: string;
  profissao?: string;
  telefoneSecundario?: string;
  telefoneReferencia?: string;
  codigo_legado?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  documentos?: { tipo: string; numero: string }[];
}

type TabId = "resumo" | "dados" | "consultas" | "anexos" | "historico";

interface HistoricoItem {
  id: string;
  data: string; // ISO
  campo: string;
  de?: string;
  para?: string;
  usuario?: string;
}

const ProntuarioPaciente = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<PacienteServiceModel | null>(null);
  const [meta, setMeta] = useState<ExtendedPacienteMeta | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [tab, setTab] = useState<TabId>("resumo");
  const [historico, setHistorico] = useState<HistoricoItem[]>([]); // placeholder local
  const [uploading, setUploading] = useState(false);

  // Carregar paciente + meta + consultas + anexos
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const respPaciente = await getPatientById(id);
        if (!mounted) return;
        if (respPaciente.success && respPaciente.data) {
          setPaciente(respPaciente.data);
        } else {
          throw new Error(respPaciente.error || "Paciente não encontrado");
        }
        // metadata local
        try {
          const raw = localStorage.getItem("pacientes_meta") || "{}";
          const parsed = JSON.parse(raw) as Record<
            string,
            ExtendedPacienteMeta
          >;
          setMeta(parsed[id] || null);
        } catch {
          setMeta(null);
        }
        // consultas (últimas + futuras limitadas)
        const respConsultas = await consultasService.listarPorPaciente(id, {
          limit: 20,
        });
        if (respConsultas.success && respConsultas.data)
          setConsultas(respConsultas.data);
        // anexos
        try {
          const anexosList = await listPatientAttachments(id);
          setAnexos(anexosList);
        } catch {
          console.warn("Falha ao carregar anexos");
        }
        // histórico (placeholder - poderá ser alimentado quando audit trail existir)
        const histRaw = localStorage.getItem(`paciente_hist_${id}`) || "[]";
        try {
          setHistorico(JSON.parse(histRaw));
        } catch {
          setHistorico([]);
        }
      } catch {
        toast.error("Paciente não encontrado");
        navigate("/painel-secretaria");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const consultasOrdenadas = useMemo(() => {
    return [...consultas].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  }, [consultas]);

  const ultimaConsulta = consultasOrdenadas.find(() => true);
  const proximaConsulta = useMemo(() => {
    const agora = new Date().toISOString();
    return consultasOrdenadas
      .filter((c) => c.dataHora >= agora)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))[0];
  }, [consultasOrdenadas]);

  const idade = useMemo(() => {
    if (!paciente?.dataNascimento) return null;
    const d = new Date(paciente.dataNascimento);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }, [paciente?.dataNascimento]);

  const handleUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return;
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const anexo = await addPatientAttachment(id, file);
        setAnexos((a) => [...a, anexo]);
      }
      toast.success("Anexo(s) enviado(s) com sucesso");
    } catch {
      toast.error("Falha ao enviar anexo");
    } finally {
      setUploading(false);
      ev.target.value = ""; // reset
    }
  };

  const handleRemoveAnexo = async (anexo: Anexo) => {
    if (!id) return;
    if (!confirm(`Remover anexo "${anexo.nome || anexo.id}"?`)) return;
    try {
      await removePatientAttachment(id, anexo.id);
      setAnexos((as) => as.filter((a) => a.id !== anexo.id));
      toast.success("Anexo removido");
    } catch {
      toast.error("Erro ao remover anexo");
    }
  };

  const formatDataHora = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  const TabButton = ({ id: tabId, label }: { id: TabId; label: string }) => (
    <button
      onClick={() => setTab(tabId)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t ${
        tab === tabId
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          className="text-sm text-gray-500 hover:underline"
          onClick={() => navigate(-1)}
        >
          &larr; Voltar
        </button>
        <div className="animate-pulse h-6 bg-gray-200 w-40 rounded" />
        <div className="animate-pulse h-4 bg-gray-200 w-full rounded" />
        <div className="animate-pulse h-4 bg-gray-200 w-2/3 rounded" />
      </div>
    );
  }

  if (!paciente) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            className="text-sm text-gray-500 hover:underline"
            onClick={() => navigate(-1)}
          >
            &larr; Voltar
          </button>
          <h1 className="text-2xl font-semibold mt-1">
            Prontuário: {paciente.nome}
          </h1>
          <p className="text-sm text-gray-500">
            CPF: {paciente.cpf || "—"} {idade ? `• ${idade} anos` : ""}
          </p>
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        <TabButton id="resumo" label="Resumo" />
        <TabButton id="dados" label="Dados" />
        <TabButton id="consultas" label="Consultas" />
        <TabButton id="anexos" label="Anexos" />
        <TabButton id="historico" label="Histórico" />
      </div>

      {tab === "resumo" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
            <h2 className="font-semibold mb-3">Visão Geral</h2>
            <ul className="text-sm space-y-1">
              <li>
                Última consulta: {formatDataHora(ultimaConsulta?.dataHora)}
              </li>
              <li>
                Próxima consulta: {formatDataHora(proximaConsulta?.dataHora)}
              </li>
              <li>Convênio: {paciente.convenio || "Particular"}</li>
              <li>VIP: {paciente.vip ? "Sim" : "Não"}</li>
              <li>Tipo sanguíneo: {paciente.tipoSanguineo || "—"}</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
            <h2 className="font-semibold mb-3">Contato</h2>
            <ul className="text-sm space-y-1">
              <li>Email: {paciente.email || "—"}</li>
              <li>Telefone: {paciente.telefone || "—"}</li>
              <li>
                Endereço:{" "}
                {paciente.endereco?.rua
                  ? `${paciente.endereco.rua}, ${
                      paciente.endereco.numero || "s/n"
                    } - ${paciente.endereco.bairro || ""}`
                  : "—"}
              </li>
              <li>
                Cidade/UF: {paciente.endereco?.cidade || ""}
                {paciente.endereco?.estado
                  ? `/${paciente.endereco.estado}`
                  : ""}
              </li>
            </ul>
          </div>
        </div>
      )}

      {tab === "dados" && (
        <div className="p-4 bg-white rounded-xl shadow border border-gray-200 space-y-4">
          <h2 className="font-semibold">Dados Completos</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">RG</p>
              <p>{meta?.rg || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado Civil</p>
              <p>{meta?.estado_civil || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Profissão</p>
              <p>{meta?.profissao || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Responsável</p>
              <p>{meta?.responsavel_nome || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Responsável CPF</p>
              <p>{meta?.responsavel_cpf || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Código Legado</p>
              <p>{meta?.codigo_legado || "—"}</p>
            </div>
            <div className="md:col-span-3">
              <p className="text-gray-500 mb-1">Documentos Extras</p>
              {meta?.documentos && meta.documentos.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {meta.documentos.map((d, idx) => (
                    <li key={idx}>
                      {d.tipo}: {d.numero}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "consultas" && (
        <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
          <h2 className="font-semibold mb-4">Consultas</h2>
          {consultasOrdenadas.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhuma consulta encontrada.
            </p>
          )}
          <ul className="divide-y">
            {consultasOrdenadas.map((c) => (
              <li
                key={c.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formatDataHora(c.dataHora)} {c.tipo && `• ${c.tipo}`}
                  </p>
                  <p className="text-gray-500">Status: {c.status}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:underline text-xs">
                    Detalhes
                  </button>
                  <button className="text-red-600 hover:underline text-xs">
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "anexos" && (
        <div className="p-4 bg-white rounded-xl shadow border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Anexos</h2>
            <label className="text-sm bg-blue-600 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
              {uploading ? "Enviando..." : "Enviar Arquivos"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
          {anexos.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum anexo.</p>
          )}
          <ul className="divide-y">
            {anexos.map((a) => (
              <li
                key={a.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{a.nome || a.id}</p>
                  <p className="text-gray-500 text-xs">
                    {a.tipo || a.categoria || "arquivo"}{" "}
                    {a.tamanho ? `• ${(a.tamanho / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                    >
                      Abrir
                    </a>
                  )}
                  <button
                    onClick={() => handleRemoveAnexo(a)}
                    className="text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "historico" && (
        <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
          <h2 className="font-semibold mb-4">
            Histórico de Alterações (Local)
          </h2>
          {historico.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum registro ainda.</p>
          )}
          <ul className="divide-y">
            {historico.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <p>
                  <span className="font-medium">{item.campo}</span> alterado{" "}
                  {item.de ? `de "${item.de}" ` : ""}para "{item.para}"
                </p>
                <p className="text-xs text-gray-500">
                  {formatDataHora(item.data)}{" "}
                  {item.usuario && `• ${item.usuario}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProntuarioPaciente;
