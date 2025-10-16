import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Stethoscope,
  UserCog,
  Plus,
  Edit,
  Trash2,
  Shield,
  X,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  createPatient,
  listPatients,
  updatePatient,
  deletePatient,
  type Paciente,
} from "../services/pacienteService";
import {
  createDoctor,
  listDoctors,
  updateDoctor,
  deleteDoctor,
  type Doctor,
} from "../services/doctorService";
import {
  createUser,
  type CreateUserInput,
  type RoleType,
} from "../services/adminService";
import adminUserService, {
  FullUserInfo,
  UpdateUserData,
  UserRole,
} from "../services/adminUserService";

type TabType = "pacientes" | "usuarios" | "medicos";

const PainelAdmin: React.FC = () => {
  const { roles: authUserRoles } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("pacientes");
  const [loading, setLoading] = useState(false);

  // Estados para pacientes
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formPaciente, setFormPaciente] = useState({
    full_name: "",
    cpf: "",
    email: "",
    phone_mobile: "",
    birth_date: "",
    social_name: "",
    sex: "",
    blood_type: "",
    weight_kg: "",
    height_m: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  });

  // Estados para usuários
  const [usuarios, setUsuarios] = useState<FullUserInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<FullUserInfo | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [managingRolesUser, setManagingRolesUser] =
    useState<FullUserInfo | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState<string>("");
  const [formUser, setFormUser] = useState<CreateUserInput>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "user",
  });

  // Estados para médicos
  const [medicos, setMedicos] = useState<Doctor[]>([]);
  const [showMedicoModal, setShowMedicoModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Doctor | null>(null);
  const [formMedico, setFormMedico] = useState({
    crm: "",
    crm_uf: "SP",
    specialty: "",
    full_name: "",
    cpf: "",
    email: "",
    phone_mobile: "",
    phone2: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    birth_date: "",
    rg: "",
    active: true,
  });

  // Verificar permissão de admin
  useEffect(() => {
    const isAdmin =
      authUserRoles.includes("admin") || authUserRoles.includes("gestor");
    if (!isAdmin) {
      toast.error("Acesso negado: apenas administradores");
      navigate("/");
    }
  }, [authUserRoles, navigate]);

  // Carregar dados conforme aba ativa
  useEffect(() => {
    if (activeTab === "pacientes") {
      loadPacientes();
    } else if (activeTab === "usuarios") {
      loadUsuarios();
    } else if (activeTab === "medicos") {
      loadMedicos();
    }
  }, [activeTab]);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const result = await adminUserService.listAllUsers();
      if (result.success && result.data) {
        setUsuarios(result.data);
      } else {
        toast.error(result.error || "Erro ao carregar usuários");
      }
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const loadPacientes = async () => {
    setLoading(true);
    try {
      const response = await listPatients({ per_page: 100 });
      if ("data" in response) {
        setPacientes(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast.error("Erro ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const loadMedicos = async () => {
    setLoading(true);
    try {
      const response = await listDoctors();
      if (response.success && response.data) {
        setMedicos(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
      toast.error("Erro ao carregar médicos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createUser(formUser);

      if (response.success) {
        toast.success(`Usuário ${formUser.full_name} criado com sucesso!`);
        setShowUserModal(false);
        resetFormUser();
      } else {
        toast.error(response.error || "Erro ao criar usuário");
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  // Funções de gerenciamento de usuários
  const handleEditUser = (user: FullUserInfo) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.profile?.full_name || "",
      email: user.profile?.email || "",
      phone: user.profile?.phone || "",
      disabled: user.profile?.disabled || false,
    });
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    try {
      const result = await adminUserService.updateUser(
        editingUser.user.id,
        editForm
      );
      if (result.success) {
        toast.success("Usuário atualizado com sucesso!");
        setEditingUser(null);
        loadUsuarios();
      } else {
        toast.error(result.error || "Erro ao atualizar usuário");
      }
    } catch {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleToggleStatusUser = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      const result = currentStatus
        ? await adminUserService.enableUser(userId)
        : await adminUserService.disableUser(userId);

      if (result.success) {
        toast.success(
          `Usuário ${
            currentStatus ? "habilitado" : "desabilitado"
          } com sucesso!`
        );
        loadUsuarios();
      } else {
        toast.error(result.error || "Erro ao alterar status do usuário");
      }
    } catch {
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar o usuário "${userName}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      const result = await adminUserService.deleteUser(userId);
      if (result.success) {
        toast.success("Usuário deletado com sucesso!");
        loadUsuarios();
      } else {
        toast.error(result.error || "Erro ao deletar usuário");
      }
    } catch {
      toast.error("Erro ao deletar usuário");
    }
  };

  // Funções de gerenciamento de pacientes
  const handleEditPaciente = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormPaciente({
      full_name: paciente.nome,
      cpf: paciente.cpf || "",
      email: paciente.email || "",
      phone_mobile: paciente.telefone || "",
      birth_date: paciente.dataNascimento || "",
      social_name: paciente.socialName || "",
      sex: paciente.sexo || "",
      blood_type: paciente.tipoSanguineo || "",
      weight_kg: paciente.pesoKg?.toString() || "",
      height_m: paciente.alturaM?.toString() || "",
      street: paciente.endereco?.rua || "",
      number: paciente.endereco?.numero || "",
      complement: paciente.endereco?.complemento || "",
      neighborhood: paciente.endereco?.bairro || "",
      city: paciente.endereco?.cidade || "",
      state: paciente.endereco?.estado || "",
      cep: paciente.endereco?.cep || "",
    });
    setShowPacienteModal(true);
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        nome: formPaciente.full_name,
        cpf: formPaciente.cpf.replace(/\D/g, ""), // Remover máscara do CPF
        email: formPaciente.email,
        telefone: formPaciente.phone_mobile,
        dataNascimento: formPaciente.birth_date,
        socialName: formPaciente.social_name,
        sexo: formPaciente.sex,
        tipoSanguineo: formPaciente.blood_type,
        pesoKg: formPaciente.weight_kg
          ? parseFloat(formPaciente.weight_kg)
          : undefined,
        alturaM: formPaciente.height_m
          ? parseFloat(formPaciente.height_m)
          : undefined,
        endereco: {
          rua: formPaciente.street,
          numero: formPaciente.number,
          complemento: formPaciente.complement,
          bairro: formPaciente.neighborhood,
          cidade: formPaciente.city,
          estado: formPaciente.state,
          cep: formPaciente.cep,
        },
      };

      if (editingPaciente) {
        const response = await updatePatient(editingPaciente.id, data);
        if (response.success) {
          toast.success("Paciente atualizado com sucesso!");
          setShowPacienteModal(false);
          setEditingPaciente(null);
          resetFormPaciente();
          loadPacientes();
        } else {
          toast.error(response.error || "Erro ao atualizar paciente");
        }
      } else {
        const response = await createPatient(data);
        if (response.success) {
          toast.success("Paciente criado com sucesso!");
          setShowPacienteModal(false);
          resetFormPaciente();
          loadPacientes();
        } else {
          toast.error(response.error || "Erro ao criar paciente");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      toast.error("Erro ao salvar paciente");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaciente = async (id: string, nome: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar o paciente "${nome}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      console.log("[PainelAdmin] Deletando paciente:", { id, nome });

      const response = await deletePatient(id);

      console.log("[PainelAdmin] Resultado da deleção:", response);

      if (response.success) {
        toast.success("Paciente deletado com sucesso!");
        loadPacientes();
      } else {
        console.error("[PainelAdmin] Falha ao deletar:", response.error);
        toast.error(response.error || "Erro ao deletar paciente");
      }
    } catch (error) {
      console.error("[PainelAdmin] Erro ao deletar paciente:", error);
      toast.error("Erro ao deletar paciente");
    }
  };

  // Funções de gerenciamento de médicos
  const handleEditMedico = (medico: Doctor) => {
    setEditingMedico(medico);
    setFormMedico({
      crm: medico.crm || "",
      crm_uf: medico.crm_uf || "SP",
      specialty: medico.specialty || "",
      full_name: medico.full_name || "",
      cpf: medico.cpf || "",
      email: medico.email || "",
      phone_mobile: medico.phone_mobile || "",
      phone2: medico.phone2 || "",
      cep: medico.cep || "",
      street: medico.street || "",
      number: medico.number || "",
      complement: medico.complement || "",
      neighborhood: medico.neighborhood || "",
      city: medico.city || "",
      state: medico.state || "",
      birth_date: medico.birth_date || "",
      rg: medico.rg || "",
      active: medico.active ?? true,
    });
    setShowMedicoModal(true);
  };

  const handleSaveMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar dados com CPF sem máscara
      const medicoData = {
        ...formMedico,
        cpf: formMedico.cpf.replace(/\D/g, ""), // Remover máscara do CPF
      };

      if (editingMedico) {
        const response = await updateDoctor(editingMedico.id!, medicoData);
        if (response.success) {
          toast.success("Médico atualizado com sucesso!");
          setShowMedicoModal(false);
          setEditingMedico(null);
          resetFormMedico();
          loadMedicos();
        } else {
          toast.error(response.error || "Erro ao atualizar médico");
        }
      } else {
        const response = await createDoctor(medicoData);
        if (response.success) {
          toast.success("Médico criado com sucesso!");
          setShowMedicoModal(false);
          resetFormMedico();
          loadMedicos();
        } else {
          toast.error(response.error || "Erro ao criar médico");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar médico:", error);
      toast.error("Erro ao salvar médico");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedico = async (id: string, nome: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar o médico "${nome}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      const response = await deleteDoctor(id);
      if (response.success) {
        toast.success("Médico deletado com sucesso!");
        loadMedicos();
      } else {
        toast.error(response.error || "Erro ao deletar médico");
      }
    } catch {
      toast.error("Erro ao deletar médico");
    }
  };

  const resetFormPaciente = () => {
    setFormPaciente({
      full_name: "",
      cpf: "",
      email: "",
      phone_mobile: "",
      birth_date: "",
      social_name: "",
      sex: "",
      blood_type: "",
      weight_kg: "",
      height_m: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
    });
  };

  const resetFormUser = () => {
    setFormUser({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "user",
    });
  };

  const resetFormMedico = () => {
    setFormMedico({
      crm: "",
      crm_uf: "SP",
      specialty: "",
      full_name: "",
      cpf: "",
      email: "",
      phone_mobile: "",
      phone2: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      birth_date: "",
      rg: "",
      active: true,
    });
  };

  const estadosBR = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  const availableRoles: RoleType[] = [
    "admin",
    "gestor",
    "medico",
    "secretaria",
    "user",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Painel de Administração
              </h1>
              <p className="text-gray-600">
                Gerenciar pacientes, usuários e médicos do sistema
              </p>
            </div>
            <UserCog className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow border border-gray-200 mb-6">
          <div
            className="flex border-b"
            role="tablist"
            aria-label="Seções do administrador"
          >
            <button
              onClick={() => setActiveTab("pacientes")}
              id="tab-pacientes-tab"
              role="tab"
              aria-selected={activeTab === "pacientes"}
              aria-controls="tab-pacientes-panel"
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                activeTab === "pacientes"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Users className="w-5 h-5" />
              Pacientes
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              id="tab-usuarios-tab"
              role="tab"
              aria-selected={activeTab === "usuarios"}
              aria-controls="tab-usuarios-panel"
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                activeTab === "usuarios"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab("medicos")}
              id="tab-medicos-tab"
              role="tab"
              aria-selected={activeTab === "medicos"}
              aria-controls="tab-medicos-panel"
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                activeTab === "medicos"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              Médicos
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "pacientes" && (
              <div
                id="tab-pacientes-panel"
                role="tabpanel"
                aria-labelledby="tab-pacientes-tab"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Pacientes Cadastrados</h2>
                  <button
                    onClick={() => setShowPacienteModal(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Paciente
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : (
                  <div className="grid gap-4">
                    {pacientes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum paciente cadastrado
                      </div>
                    ) : (
                      pacientes.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`rounded-lg p-4 flex items-center justify-between transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-gray-100`}
                        >
                          <div>
                            <h3 className="font-semibold text-lg">{p.nome}</h3>
                            <p className="text-gray-600 text-sm">
                              {p.email} | {p.telefone}
                            </p>
                            <p className="text-gray-500 text-xs">
                              CPF: {p.cpf} | Nascimento: {p.dataNascimento}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPaciente(p)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePaciente(p.id, p.nome)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "usuarios" && (
              <div
                id="tab-usuarios-panel"
                role="tabpanel"
                aria-labelledby="tab-usuarios-tab"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Gerenciar Usuários</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={loadUsuarios}
                      disabled={loading}
                      className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                      Atualizar
                    </button>
                    <button
                      onClick={() => setShowUserModal(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <Plus className="w-5 h-5" />
                      Novo Usuário
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40 transition-colors"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">Carregando usuários...</div>
                ) : (
                  <div className="overflow-auto max-h-[70vh] bg-white rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Nome
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Telefone
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Roles
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {usuarios.filter((user) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            user.profile?.full_name
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            user.profile?.email
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            user.user.email.toLowerCase().includes(searchLower)
                          );
                        }).length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              {searchTerm
                                ? "Nenhum usuário encontrado"
                                : "Nenhum usuário cadastrado"}
                            </td>
                          </tr>
                        ) : (
                          usuarios
                            .filter((user) => {
                              const searchLower = searchTerm.toLowerCase();
                              return (
                                user.profile?.full_name
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                user.profile?.email
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                user.user.email
                                  .toLowerCase()
                                  .includes(searchLower)
                              );
                            })
                            .map((user) => (
                              <tr
                                key={user.user.id}
                                className="hover:bg-gray-50 odd:bg-white even:bg-gray-50"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">
                                    {user.profile?.full_name || "Sem nome"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {user.profile?.email || user.user.email}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {user.profile?.phone || "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {user.roles && user.roles.length > 0 ? (
                                      user.roles.map((role, index) => (
                                        <span
                                          key={index}
                                          className={`px-2 py-1 rounded text-xs font-semibold ${
                                            role === "admin"
                                              ? "bg-purple-100 text-purple-700"
                                              : role === "gestor"
                                              ? "bg-blue-100 text-blue-700"
                                              : role === "medico"
                                              ? "bg-indigo-100 text-indigo-700"
                                              : role === "secretaria"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-gray-100 text-gray-700"
                                          }`}
                                        >
                                          {role}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        Sem roles
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      user.profile?.disabled
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {user.profile?.disabled
                                      ? "Desabilitado"
                                      : "Ativo"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setManagingRolesUser(user);
                                        const result =
                                          await adminUserService.getUserRoles(
                                            user.user.id
                                          );
                                        if (result.success && result.data) {
                                          setUserRoles(result.data);
                                        }
                                      }}
                                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                                      title="Gerenciar Roles"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleToggleStatusUser(
                                          user.user.id,
                                          !!user.profile?.disabled
                                        )
                                      }
                                      className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                                        user.profile?.disabled
                                          ? "text-green-600 hover:bg-green-50 focus-visible:ring-green-500"
                                          : "text-orange-600 hover:bg-orange-50 focus-visible:ring-orange-500"
                                      }`}
                                      title={
                                        user.profile?.disabled
                                          ? "Habilitar"
                                          : "Desabilitar"
                                      }
                                    >
                                      {user.profile?.disabled ? (
                                        <UserCheck className="w-4 h-4" />
                                      ) : (
                                        <UserX className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteUser(
                                          user.user.id,
                                          user.profile?.full_name ||
                                            user.user.email
                                        )
                                      }
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                      title="Deletar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "medicos" && (
              <div
                id="tab-medicos-panel"
                role="tabpanel"
                aria-labelledby="tab-medicos-tab"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Médicos Cadastrados</h2>
                  <button
                    onClick={() => setShowMedicoModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Médico
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : (
                  <div className="grid gap-4">
                    {medicos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum médico cadastrado
                      </div>
                    ) : (
                      medicos.map((m, idx) => (
                        <div
                          key={m.id}
                          className={`rounded-lg p-4 flex items-center justify-between transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-gray-100`}
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {m.full_name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {m.specialty} | CRM: {m.crm}/{m.crm_uf}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {m.email} | {m.phone_mobile}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                m.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {m.active ? "Ativo" : "Inativo"}
                            </span>
                            <button
                              onClick={() => handleEditMedico(m)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMedico(
                                  m.id!,
                                  m.full_name || "Médico sem nome"
                                )
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Paciente */}
      {showPacienteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paciente-modal-title"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 id="paciente-modal-title" className="text-2xl font-bold mb-4">
                Novo Paciente
              </h2>
              <form onSubmit={handleSavePaciente} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPaciente.full_name}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome Social
                    </label>
                    <input
                      type="text"
                      value={formPaciente.social_name}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          social_name: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPaciente.cpf}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          cpf: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                      placeholder="00000000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formPaciente.email}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          email: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPaciente.phone_mobile}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          phone_mobile: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formPaciente.birth_date}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          birth_date: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sexo
                    </label>
                    <select
                      value={formPaciente.sex}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          sex: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tipo Sanguíneo
                    </label>
                    <input
                      type="text"
                      value={formPaciente.blood_type}
                      onChange={(e) =>
                        setFormPaciente({
                          ...formPaciente,
                          blood_type: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600/40"
                      placeholder="A+"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPacienteModal(false);
                      setEditingPaciente(null);
                      resetFormPaciente();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  >
                    {loading
                      ? editingPaciente
                        ? "Salvando..."
                        : "Criando..."
                      : editingPaciente
                      ? "Salvar"
                      : "Criar Paciente"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Usuário */}
      {showUserModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="usuario-modal-title"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 id="usuario-modal-title" className="text-2xl font-bold mb-4">
                Novo Usuário
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUser.full_name}
                    onChange={(e) =>
                      setFormUser({ ...formUser, full_name: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formUser.email}
                    onChange={(e) =>
                      setFormUser({ ...formUser, email: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Senha Temporária * (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formUser.password}
                    onChange={(e) =>
                      setFormUser({ ...formUser, password: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formUser.phone || ""}
                    onChange={(e) =>
                      setFormUser({ ...formUser, phone: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role/Papel *
                  </label>
                  <select
                    required
                    value={formUser.role}
                    onChange={(e) =>
                      setFormUser({
                        ...formUser,
                        role: e.target.value as RoleType,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      resetFormUser();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    {loading ? "Criando..." : "Criar Usuário"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Médico */}
      {showMedicoModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medico-modal-title"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 id="medico-modal-title" className="text-2xl font-bold mb-4">
                Novo Médico
              </h2>
              <form onSubmit={handleSaveMedico} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formMedico.full_name}
                      onChange={(e) =>
                        setFormMedico({
                          ...formMedico,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Especialidade
                    </label>
                    <input
                      type="text"
                      value={formMedico.specialty}
                      onChange={(e) =>
                        setFormMedico({
                          ...formMedico,
                          specialty: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                      placeholder="Cardiologia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      CRM *
                    </label>
                    <input
                      type="text"
                      required
                      value={formMedico.crm}
                      onChange={(e) =>
                        setFormMedico({ ...formMedico, crm: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      UF do CRM *
                    </label>
                    <select
                      required
                      value={formMedico.crm_uf}
                      onChange={(e) =>
                        setFormMedico({ ...formMedico, crm_uf: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                    >
                      {estadosBR.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      value={formMedico.cpf}
                      onChange={(e) =>
                        setFormMedico({ ...formMedico, cpf: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RG</label>
                    <input
                      type="text"
                      value={formMedico.rg}
                      onChange={(e) =>
                        setFormMedico({ ...formMedico, rg: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formMedico.email}
                      onChange={(e) =>
                        setFormMedico({ ...formMedico, email: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formMedico.phone_mobile}
                      onChange={(e) =>
                        setFormMedico({
                          ...formMedico,
                          phone_mobile: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formMedico.birth_date}
                      onChange={(e) =>
                        setFormMedico({
                          ...formMedico,
                          birth_date: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={formMedico.active}
                        onChange={(e) =>
                          setFormMedico({
                            ...formMedico,
                            active: e.target.checked,
                          })
                        }
                        className="w-4 h-4 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMedicoModal(false);
                      setEditingMedico(null);
                      resetFormMedico();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  >
                    {loading
                      ? editingMedico
                        ? "Salvando..."
                        : "Criando..."
                      : editingMedico
                      ? "Salvar"
                      : "Criar Médico"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-usuario-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h2
              id="editar-usuario-title"
              className="text-xl font-bold text-gray-900 mb-4"
            >
              Editar Usuário
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editForm.full_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Roles */}
      {managingRolesUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gerenciar-roles-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
            <h2
              id="gerenciar-roles-title"
              className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"
            >
              <Shield className="w-5 h-5 text-purple-600" />
              Gerenciar Roles
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {managingRolesUser.profile?.full_name ||
                managingRolesUser.user.email}
            </p>

            {/* Lista de roles atuais */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Roles Atuais:
              </h3>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map((userRole) => (
                    <div
                      key={userRole.id}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        userRole.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : userRole.role === "gestor"
                          ? "bg-blue-100 text-blue-700"
                          : userRole.role === "medico"
                          ? "bg-indigo-100 text-indigo-700"
                          : userRole.role === "secretaria"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {userRole.role}
                      <button
                        onClick={async () => {
                          const result = await adminUserService.removeUserRole(
                            userRole.id
                          );
                          if (result.success) {
                            toast.success("Role removido com sucesso!");
                            const rolesResult =
                              await adminUserService.getUserRoles(
                                managingRolesUser.user.id
                              );
                            if (rolesResult.success && rolesResult.data) {
                              setUserRoles(rolesResult.data);
                            }
                            loadUsuarios();
                          } else {
                            toast.error(result.error || "Erro ao remover role");
                          }
                        }}
                        className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">
                    Nenhum role atribuído
                  </span>
                )}
              </div>
            </div>

            {/* Adicionar novo role */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Adicionar Role:
              </h3>
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600/40 text-sm"
                >
                  <option value="">Selecione um role...</option>
                  <option value="admin">Admin</option>
                  <option value="gestor">Gestor</option>
                  <option value="medico">Médico</option>
                  <option value="secretaria">Secretária</option>
                  <option value="user">Usuário</option>
                </select>
                <button
                  onClick={async () => {
                    if (!newRole) {
                      toast.error("Selecione um role");
                      return;
                    }

                    const result = await adminUserService.addUserRole(
                      managingRolesUser.user.id,
                      newRole as
                        | "admin"
                        | "gestor"
                        | "medico"
                        | "secretaria"
                        | "user"
                    );

                    if (result.success) {
                      toast.success("Role adicionado com sucesso!");
                      setNewRole("");
                      const rolesResult = await adminUserService.getUserRoles(
                        managingRolesUser.user.id
                      );
                      if (rolesResult.success && rolesResult.data) {
                        setUserRoles(rolesResult.data);
                      }
                      loadUsuarios();
                    } else {
                      toast.error(result.error || "Erro ao adicionar role");
                    }
                  }}
                  disabled={!newRole}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setManagingRolesUser(null);
                  setUserRoles([]);
                  setNewRole("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelAdmin;
