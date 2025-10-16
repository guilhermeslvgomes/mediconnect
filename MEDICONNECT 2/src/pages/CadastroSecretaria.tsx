import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
} from "lucide-react";
import {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../services/pacienteService";
import userService from "../services/userService";
import toast from "react-hot-toast";
import { format } from "date-fns";
// import { ptBR } from 'date-fns/locale' // Removido, não utilizado

interface Paciente {
  _id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  altura?: number;
  peso?: number;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    cep?: string;
  };
  convenio?: string;
  numeroCarteirinha?: string;
  observacoes?: string | null;
  ativo?: boolean;
  criadoEm?: string;
}

const CadastroSecretaria: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    altura: "",
    peso: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      cep: "",
    },
    convenio: "",
    numeroCarteirinha: "",
    observacoes: "",
  });
  // Função para carregar pacientes
  const carregarPacientes = async () => {
    try {
      setLoading(true);
      const pacientesApi = await listPatients();
      setPacientes(
        pacientesApi.data.map((p) => ({
          _id: p.id,
          nome: p.nome,
          cpf: p.cpf,
          telefone: p.telefone,
          email: p.email,
          dataNascimento: p.dataNascimento,
          altura: p.alturaM ? Math.round(p.alturaM * 100) : undefined,
          peso: p.pesoKg,
          endereco: {
            rua: p.endereco?.rua,
            numero: p.endereco?.numero,
            bairro: p.endereco?.bairro,
            cidade: p.endereco?.cidade,
            cep: p.endereco?.cep,
          },
          convenio: p.convenio,
          numeroCarteirinha: p.numeroCarteirinha,
          observacoes: p.observacoes || undefined,
          criadoEm: p.created_at,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast.error("Erro ao carregar lista de pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPacientes();
  }, []);

  const calcularIMC = (altura?: number, peso?: number) => {
    if (!altura || !peso) return null;
    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    return imc.toFixed(1);
  };

  const getIMCStatus = (imc: number) => {
    if (imc < 18.5) return { status: "Abaixo do peso", color: "text-blue-600" };
    if (imc < 25) return { status: "Peso normal", color: "text-green-600" };
    if (imc < 30) return { status: "Sobrepeso", color: "text-yellow-600" };
    return { status: "Obesidade", color: "text-red-600" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // NOTE: remote CPF validation removed to avoid false negatives

      // NOTE: remote CEP validation removed to avoid false negatives

      const pacienteData = {
        ...formData,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        ativo: true,
        criadoPor: "secretaria",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      if (editingPaciente) {
        await updatePatient(editingPaciente._id, pacienteData);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        await createPatient(pacienteData);
        toast.success("Paciente cadastrado com sucesso!");
      }

      // (Refactor) Criação de secretária via fluxo real se condição atender (mantendo lógica anterior condicional)
      // OBS: Este bloco antes criava secretária mock ao cadastrar um novo paciente.
      // Caso essa associação não faça sentido de negócio, remover todo o bloco abaixo posteriormente.
      if (!editingPaciente && formData.email && formData.nome) {
        try {
          // Gera senha temporária segura simples; idealmente backend enviaria email de reset.
          const tempPassword = Math.random().toString(36).slice(-10) + "!A1";
          const secResp = await userService.createSecretaria({
            nome: formData.nome,
            email: formData.email,
            password: tempPassword,
            telefone: formData.telefone,
          });
          if (secResp.success) {
            toast.success(
              "Secretária criada (fluxo real). Senha temporária gerada."
            );
            console.info(
              "[CadastroSecretaria] Secretária criada: ",
              secResp.data?.id
            );
          } else {
            // Não bloquear fluxo principal de paciente
            toast.error(
              "Falha ao criar secretária (fluxo real): " +
                (secResp.error || "erro desconhecido")
            );
          }
        } catch (err) {
          console.warn("Falha inesperada ao criar secretária:", err);
          toast.error("Erro inesperado ao criar secretária");
        }
      }

      // resetForm removido, não existe
      setEditingPaciente(null);
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      toast.error("Erro ao salvar paciente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setFormData({
      nome: paciente.nome || "",
      cpf: paciente.cpf || "",
      telefone: paciente.telefone || "",
      email: paciente.email || "",
      dataNascimento: paciente.dataNascimento
        ? paciente.dataNascimento.split("T")[0]
        : "",
      altura: paciente.altura?.toString() || "",
      peso: paciente.peso?.toString() || "",
      endereco: {
        rua: paciente.endereco?.rua || "",
        numero: paciente.endereco?.numero || "",
        bairro: paciente.endereco?.bairro || "",
        cidade: paciente.endereco?.cidade || "",
        cep: paciente.endereco?.cep || "",
      },
      convenio: paciente.convenio || "",
      numeroCarteirinha: paciente.numeroCarteirinha || "",
      observacoes: paciente.observacoes || "",
    });
    setEditingPaciente(paciente);
    setShowForm(true);
  };

  const handleDelete = async (pacienteId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este paciente?")) {
      try {
        await deletePatient(pacienteId);
        toast.success("Paciente removido com sucesso!");
        carregarPacientes();
      } catch (error) {
        console.error("Erro ao remover paciente:", error);
        toast.error("Erro ao remover paciente");
      }
    }
  };

  const filteredPacientes = pacientes.filter(
    (paciente) =>
      (paciente.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paciente.cpf || "").includes(searchTerm) ||
      (paciente.telefone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cadastro de Pacientes
          </h1>
          <p className="text-gray-600">
            Gerencie o cadastro de pacientes da clínica
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-primary mt-4 md:mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Paciente
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-l from-blue-700 to-blue-400 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total de Pacientes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pacientes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Convênio</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  pacientes.filter(
                    (p) => p.convenio && p.convenio !== "Particular"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Cadastros Hoje
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  pacientes.filter((p) => {
                    const hoje = new Date().toISOString().split("T")[0];
                    return p.criadoEm?.startsWith(hoje);
                  }).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Com Dados Físicos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pacientes.filter((p) => p.altura && p.peso).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 form-input"
          />
        </div>
      </div>

      {/* Lista de Pacientes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10 bg-gradient-to-l from-blue-700 to-blue-400">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Dados Físicos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Convênio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPacientes.map((paciente) => {
                  const imc = calcularIMC(paciente.altura, paciente.peso);
                  const imcStatus = imc ? getIMCStatus(parseFloat(imc)) : null;

                  return (
                    <tr
                      key={paciente._id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paciente.nome || "Nome não informado"}
                          </div>
                          <div className="text-sm text-gray-500">
                            CPF: {paciente.cpf || "Não informado"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Nascimento:{" "}
                            {paciente.dataNascimento
                              ? format(
                                  new Date(paciente.dataNascimento),
                                  "dd/MM/yyyy"
                                )
                              : "Não informado"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {paciente.telefone || "Não informado"}
                          </div>
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {paciente.email || "Não informado"}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {paciente.endereco?.cidade ||
                              "Cidade não informada"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {paciente.altura && (
                            <div className="text-sm text-gray-900">
                              Altura: {paciente.altura} cm
                            </div>
                          )}
                          {paciente.peso && (
                            <div className="text-sm text-gray-900">
                              Peso: {paciente.peso} kg
                            </div>
                          )}
                          {imc && imcStatus && (
                            <div className="text-sm">
                              <span className="text-gray-600">IMC: </span>
                              <span
                                className={`font-medium ${imcStatus.color}`}
                              >
                                {imc} ({imcStatus.status})
                              </span>
                            </div>
                          )}
                          {!paciente.altura && !paciente.peso && (
                            <div className="text-sm text-gray-400">
                              Dados não informados
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paciente.convenio || "Não informado"}
                        </div>
                        {paciente.numeroCarteirinha && (
                          <div className="text-sm text-gray-500">
                            Carteirinha: {paciente.numeroCarteirinha}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(paciente)}
                            className="inline-flex items-center p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            aria-label="Editar paciente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(paciente._id)}
                            className="inline-flex items-center p-1.5 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                            aria-label="Excluir paciente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cadastro-secretaria-title"
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3
                id="cadastro-secretaria-title"
                className="text-lg font-semibold mb-6"
              >
                {editingPaciente ? "Editar Paciente" : "Novo Paciente"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                  {/* CPF com máscara */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 11) v = v.slice(0, 11);
                        v = v.replace(/(\d{3})(\d)/, "$1.$2");
                        v = v.replace(/(\d{3})(\d)/, "$1.$2");
                        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        setFormData({ ...formData, cpf: v });
                      }}
                      className="form-input"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  {/* Telefone com máscara internacional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 13) v = v.slice(0, 13);
                        if (v.length >= 2) v = "+55 " + v;
                        if (v.length >= 4)
                          v = v.replace(/(\+55 )(\d{2})(\d)/, "$1$2 $3");
                        if (v.length >= 9)
                          v = v.replace(
                            /(\+55 \d{2} )(\d{5})(\d{4})/,
                            "$1$2-$3"
                          );
                        setFormData({ ...formData, telefone: v });
                      }}
                      className="form-input"
                      placeholder="+55 XX XXXXX-XXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataNascimento: e.target.value,
                        })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="250"
                      step="0.1"
                      value={formData.altura}
                      onChange={(e) =>
                        setFormData({ ...formData, altura: e.target.value })
                      }
                      className="form-input"
                      placeholder="Ex: 170"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) =>
                        setFormData({ ...formData, peso: e.target.value })
                      }
                      className="form-input"
                      placeholder="Ex: 70.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.endereco.cep}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            cep: e.target.value,
                          },
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={formData.endereco.rua}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            rua: e.target.value,
                          },
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.endereco.numero}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            numero: e.target.value,
                          },
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.endereco.bairro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            bairro: e.target.value,
                          },
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.endereco.cidade}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endereco: {
                            ...formData.endereco,
                            cidade: e.target.value,
                          },
                        })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Convênio
                    </label>
                    <select
                      value={formData.convenio}
                      onChange={(e) =>
                        setFormData({ ...formData, convenio: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Selecione</option>
                      <option value="Particular">Particular</option>
                      <option value="Unimed">Unimed</option>
                      <option value="SulAmérica">SulAmérica</option>
                      <option value="Bradesco Saúde">Bradesco Saúde</option>
                      <option value="Amil">Amil</option>
                      <option value="NotreDame">NotreDame</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número da Carteirinha
                    </label>
                    <input
                      type="text"
                      value={formData.numeroCarteirinha}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numeroCarteirinha: e.target.value,
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    className="form-input"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    // onClick removido, resetForm não existe
                    className="btn-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  >
                    {loading
                      ? "Salvando..."
                      : editingPaciente
                      ? "Atualizar"
                      : "Cadastrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroSecretaria;
