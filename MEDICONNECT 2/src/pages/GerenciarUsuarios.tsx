import React, { useState, useEffect } from "react";
import {
  Users,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Shield,
  Plus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import adminUserService, {
  FullUserInfo,
  UpdateUserData,
  UserRole,
} from "../services/adminUserService";

const GerenciarUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<FullUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<FullUserInfo | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [managingRolesUser, setManagingRolesUser] =
    useState<FullUserInfo | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState<string>("");

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
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

  const handleEdit = (user: FullUserInfo) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.profile?.full_name || "",
      email: user.profile?.email || "",
      phone: user.profile?.phone || "",
      disabled: user.profile?.disabled || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const result = await adminUserService.updateUser(
        editingUser.user.id,
        editForm
      );
      if (result.success) {
        toast.success("Usuário atualizado com sucesso!");
        setEditingUser(null);
        carregarUsuarios();
      } else {
        toast.error(result.error || "Erro ao atualizar usuário");
      }
    } catch {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
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
        carregarUsuarios();
      } else {
        toast.error(result.error || "Erro ao alterar status do usuário");
      }
    } catch {
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
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
        carregarUsuarios();
      } else {
        toast.error(result.error || "Erro ao deletar usuário");
      }
    } catch {
      toast.error("Erro ao deletar usuário");
    }
  };

  const usuariosFiltrados = usuarios.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.profile?.full_name?.toLowerCase().includes(searchLower) ||
      user.profile?.email?.toLowerCase().includes(searchLower) ||
      user.user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gerenciar Usuários
                </h1>
                <p className="text-gray-600">
                  Visualize e edite informações dos usuários
                </p>
              </div>
            </div>
            <button
              onClick={carregarUsuarios}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600/40"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "Nenhum usuário encontrado"
                          : "Nenhum usuário cadastrado"}
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((user, idx) => (
                      <tr
                        key={user.user.id}
                        className={`hover:bg-gray-50 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {user.profile?.full_name || "Sem nome"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.profile?.email || user.user.email}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.profile?.phone || "-"}
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.profile?.disabled
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {user.profile?.disabled ? "Desabilitado" : "Ativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(user.user.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
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
                                handleToggleStatus(
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
                                handleDelete(
                                  user.user.id,
                                  user.profile?.full_name || user.user.email
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
          </div>
        )}
      </div>

      {/* Modal de Edição */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600/40"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600/40"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600/40"
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
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                            carregarUsuarios();
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
                      carregarUsuarios();
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

export default GerenciarUsuarios;
