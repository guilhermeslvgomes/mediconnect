import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext";
import React from "react";
import type { EnderecoPaciente } from "../../services/pacienteService";

export interface PacienteFormData {
  id?: string;
  nome: string;
  social_name: string;
  cpf: string;
  rg?: string;
  estado_civil?: string;
  profissao?: string;
  sexo: string;
  dataNascimento: string;
  email: string;
  codigoPais: string;
  ddd: string;
  numeroTelefone: string;
  telefoneSecundario?: string;
  telefoneReferencia?: string;
  telefone?: string;
  tipo_sanguineo: string;
  altura: string;
  peso: string;
  convenio: string;
  numeroCarteirinha: string;
  observacoes: string;
  codigo_legado?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  documentos?: { tipo: string; numero: string }[];
  endereco: EnderecoPaciente;
  avatar_url?: string;
}

export interface PacienteFormProps {
  mode: "create" | "edit";
  loading: boolean;
  data: PacienteFormData;
  bloodTypes: string[];
  convenios: string[];
  countryOptions: { value: string; label: string }[];
  cpfError?: string | null;
  cpfValidationMessage?: string | null;
  onChange: (patch: Partial<PacienteFormData>) => void;
  onCpfChange: (value: string) => void;
  onCepLookup: (cep: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Componente base (ainda sem campos estendidos novos). Próximas iterações adicionarão seções extras.
const PacienteForm: React.FC<PacienteFormProps> = ({
  mode,
  loading,
  data,
  bloodTypes,
  convenios,
  countryOptions,
  cpfError,
  cpfValidationMessage,
  onChange,
  onCpfChange,
  onCepLookup,
  onCancel,
  onSubmit,
}) => {
  // Avatar upload/remover state
  const [avatarEditMode, setAvatarEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Obtem role do usuário autenticado
  const auth = useContext(AuthContext);
  const canEditAvatar = ["secretaria", "admin", "gestor"].includes(auth?.user?.role || "");

  // Função para upload do avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !data.id) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("file", avatarFile);
    await fetch(`https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/avatars/${data.id}/avatar`, {
      method: "POST",
      body: formData,
    });
    // Atualiza avatar_url no perfil
    const ext = avatarFile.name.split(".").pop();
    const publicUrl = `https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/public/avatars/${data.id}/avatar.${ext}`;
    await fetch(`https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/profiles?id=eq.${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: publicUrl }),
    });
    onChange({ avatar_url: publicUrl });
    setAvatarEditMode(false);
    setAvatarFile(null);
    setAvatarLoading(false);
  };

  // Função para remover avatar
  const handleAvatarRemove = async () => {
    if (!data.id) return;
    setAvatarLoading(true);
    await fetch(`https://yuanqfswhberkoevtmfr.supabase.co/storage/v1/object/avatars/${data.id}/avatar`, {
      method: "DELETE",
    });
    await fetch(`https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/profiles?id=eq.${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: null }),
    });
    onChange({ avatar_url: undefined });
    setAvatarEditMode(false);
    setAvatarFile(null);
    setAvatarLoading(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      noValidate
      aria-describedby={cpfError ? "cpf-error" : undefined}
    >
      {/* Bloco do avatar antes do título dos dados pessoais */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.nome}
              className="h-16 w-16 rounded-full object-cover border shadow"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center text-white font-semibold text-lg shadow">
              {data.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          {canEditAvatar && (
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 border shadow group-hover:bg-blue-100 transition"
              title="Editar avatar"
              onClick={() => setAvatarEditMode(true)}
              style={{ lineHeight: 0 }}
              disabled={avatarLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-600" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V17h4" /></svg>
            </button>
          )}
          {avatarEditMode && canEditAvatar && (
            <div className="absolute top-0 left-20 bg-white p-2 rounded shadow z-10 flex flex-col items-center">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                className="mb-2"
                disabled={avatarLoading}
              />
              <button type="button" className="text-xs bg-blue-600 text-white px-2 py-1 rounded" onClick={handleAvatarUpload} disabled={avatarLoading}>Salvar</button>
              <button type="button" className="text-xs ml-2" onClick={() => setAvatarEditMode(false)} disabled={avatarLoading}>Cancelar</button>
              {data.avatar_url && (
                <button type="button" className="text-xs text-red-600 underline mt-2" onClick={handleAvatarRemove} disabled={avatarLoading}>Remover</button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Todos os campos do formulário já estão dentro do <form> abaixo do avatar */}
      {/* Os campos do formulário devem continuar aqui, dentro do <form> */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Dados pessoais
          </h4>
        </div>
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nome Completo *
          </label>
          <input
            id="nome"
            type="text"
            value={data.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            required
            placeholder="Digite o nome completo"
            autoComplete="name"
          />
        </div>
        <div>
          <label
            htmlFor="social_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nome Social
          </label>
          <input
            id="social_name"
            type="text"
            value={data.social_name}
            onChange={(e) => onChange({ social_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            placeholder="Opcional"
            autoComplete="nickname"
          />
        </div>
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="rg"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                RG
              </label>
              <input
                id="rg"
                type="text"
                value={data.rg || ""}
                onChange={(e) => onChange({ rg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                placeholder="RG"
              />
            </div>
            <div>
              <label
                htmlFor="estado_civil"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estado Civil
              </label>
              <select
                id="estado_civil"
                value={data.estado_civil || ""}
                onChange={(e) => onChange({ estado_civil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
              >
                <option value="">Selecione</option>
                <option value="solteiro(a)">Solteiro(a)</option>
                <option value="casado(a)">Casado(a)</option>
                <option value="divorciado(a)">Divorciado(a)</option>
                <option value="viuvo(a)">Viúvo(a)</option>
                <option value="uniao_estavel">União estável</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="profissao"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Profissão
              </label>
              <input
                id="profissao"
                type="text"
                value={data.profissao || ""}
                onChange={(e) => onChange({ profissao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Profissão"
                autoComplete="organization-title"
              />
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="cpf"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            CPF *
          </label>
          <input
            id="cpf"
            type="text"
            value={data.cpf}
            onChange={(e) => onCpfChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors ${
              cpfError ? "border-red-500" : "border-gray-300"
            }`}
            required
            placeholder="000.000.000-00"
            inputMode="numeric"
            pattern="^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$"
            aria-invalid={!!cpfError}
            aria-describedby={cpfError ? "cpf-error" : undefined}
            autoComplete="off"
          />
          {cpfError && (
            <p id="cpf-error" className="text-red-600 text-xs mt-1">
              {cpfError}
            </p>
          )}
          {cpfValidationMessage && (
            <p className="text-xs text-gray-500 mt-1">
              Validação externa: {cpfValidationMessage}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="sexo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sexo *
          </label>
          <select
            id="sexo"
            value={data.sexo}
            onChange={(e) => onChange({ sexo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            required
          >
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="dataNascimento"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data de Nascimento *
          </label>
          <input
            id="dataNascimento"
            type="date"
            value={data.dataNascimento}
            onChange={(e) => onChange({ dataNascimento: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            required
            autoComplete="bday"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Contato
          </h4>
        </div>
        <div className="md:col-span-2">
          <fieldset className="flex flex-col gap-2" aria-required="true">
            <legend className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </legend>
            <div className="flex gap-2">
              <select
                value={data.codigoPais}
                onChange={(e) => onChange({ codigoPais: e.target.value })}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                required
                aria-label="Código do país"
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                id="ddd"
                type="text"
                value={data.ddd}
                onChange={(e) =>
                  onChange({
                    ddd: e.target.value.replace(/\D/g, "").slice(0, 2),
                  })
                }
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                placeholder="DDD"
                required
                inputMode="numeric"
                pattern="^\d{2}$"
                aria-label="DDD"
              />
              <input
                id="numeroTelefone"
                type="tel"
                value={data.numeroTelefone}
                onChange={(e) =>
                  onChange({
                    numeroTelefone: e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 9),
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
                placeholder="Número do telefone"
                required
                inputMode="numeric"
                pattern="^\d{8,9}$"
                autoComplete="tel-local"
              />
            </div>
          </fieldset>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            required
            placeholder="contato@paciente.com"
            autoComplete="email"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Informações clínicas
          </h4>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo sanguíneo
          </label>
          <select
            value={data.tipo_sanguineo}
            onChange={(e) => onChange({ tipo_sanguineo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
          >
            <option value="">Selecione</option>
            {bloodTypes.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
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
            value={data.altura}
            onChange={(e) => onChange({ altura: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            placeholder="170"
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
            value={data.peso}
            onChange={(e) => onChange({ peso: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            placeholder="70.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Convênio
          </label>
          <select
            value={data.convenio}
            onChange={(e) => onChange({ convenio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
          >
            <option value="">Selecione</option>
            {convenios.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número da carteirinha
          </label>
          <input
            type="text"
            value={data.numeroCarteirinha}
            onChange={(e) => onChange({ numeroCarteirinha: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600/40 transition-colors"
            placeholder="Informe se possuir convênio"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Endereço
          </h4>
        </div>
        <div>
          <label
            htmlFor="cep"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            CEP
          </label>
          <input
            id="cep"
            type="text"
            value={data.endereco.cep}
            onChange={(e) =>
              onChange({ endereco: { ...data.endereco, cep: e.target.value } })
            }
            onBlur={(e) => onCepLookup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="00000-000"
            inputMode="numeric"
            pattern="^\d{5}-?\d{3}$"
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label
            htmlFor="rua"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Rua
          </label>
          <input
            id="rua"
            type="text"
            value={data.endereco.rua}
            onChange={(e) =>
              onChange({ endereco: { ...data.endereco, rua: e.target.value } })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Rua"
            autoComplete="address-line1"
          />
        </div>
        <div>
          <label
            htmlFor="numero"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Número
          </label>
          <input
            id="numero"
            type="text"
            value={data.endereco.numero}
            onChange={(e) =>
              onChange({
                endereco: { ...data.endereco, numero: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Número"
            inputMode="numeric"
            pattern="^\d+[A-Za-z0-9/-]*$"
          />
        </div>
        <div>
          <label
            htmlFor="complemento"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Complemento
          </label>
          <input
            id="complemento"
            type="text"
            value={data.endereco.complemento}
            onChange={(e) =>
              onChange({
                endereco: { ...data.endereco, complemento: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Apto, bloco..."
          />
        </div>
        <div>
          <label
            htmlFor="bairro"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Bairro
          </label>
          <input
            id="bairro"
            type="text"
            value={data.endereco.bairro}
            onChange={(e) =>
              onChange({
                endereco: { ...data.endereco, bairro: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Bairro"
            autoComplete="address-line2"
          />
        </div>
        <div>
          <label
            htmlFor="cidade"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Cidade
          </label>
          <input
            id="cidade"
            type="text"
            value={data.endereco.cidade}
            onChange={(e) =>
              onChange({
                endereco: { ...data.endereco, cidade: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Cidade"
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label
            htmlFor="estado"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Estado
          </label>
          <input
            id="estado"
            type="text"
            value={data.endereco.estado}
            onChange={(e) =>
              onChange({
                endereco: { ...data.endereco, estado: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Estado"
            autoComplete="address-level1"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={data.observacoes}
            onChange={(e) => onChange({ observacoes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            placeholder="Observações gerais do paciente"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Contato adicional
          </h4>
        </div>
        <div>
          <label
            htmlFor="telefoneSecundario"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Telefone secundário
          </label>
          <input
            id="telefoneSecundario"
            type="text"
            value={data.telefoneSecundario || ""}
            onChange={(e) => onChange({ telefoneSecundario: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="(DDD) 00000-0000"
            inputMode="numeric"
          />
        </div>
        <div>
          <label
            htmlFor="telefoneReferencia"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Telefone de referência
          </label>
          <input
            id="telefoneReferencia"
            type="text"
            value={data.telefoneReferencia || ""}
            onChange={(e) => onChange({ telefoneReferencia: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Contato de apoio"
            inputMode="numeric"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Responsável (menores)
          </h4>
        </div>
        <div>
          <label
            htmlFor="responsavel_nome"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nome do responsável
          </label>
          <input
            id="responsavel_nome"
            type="text"
            value={data.responsavel_nome || ""}
            onChange={(e) => onChange({ responsavel_nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nome completo"
            autoComplete="name"
          />
        </div>
        <div>
          <label
            htmlFor="responsavel_cpf"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            CPF do responsável
          </label>
          <input
            id="responsavel_cpf"
            type="text"
            value={data.responsavel_cpf || ""}
            onChange={(e) => onChange({ responsavel_cpf: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="000.000.000-00"
            inputMode="numeric"
            pattern="^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Identificação extra
          </h4>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código legado
          </label>
          <input
            type="text"
            value={data.codigo_legado || ""}
            onChange={(e) => onChange({ codigo_legado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="ID em outro sistema"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documentos extras
          </label>
          <DocumentosExtras
            documentos={data.documentos || []}
            onChange={(docs) => onChange({ documentos: docs })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Salvando..." : mode === "create" ? "Cadastrar" : "Salvar"}
        </button>
      </div>
    </form>
  );
};

export default PacienteForm;

interface DocumentosExtrasProps {
  documentos: { tipo: string; numero: string }[];
  onChange: (docs: { tipo: string; numero: string }[]) => void;
}

const DocumentosExtras: React.FC<DocumentosExtrasProps> = ({
  documentos,
  onChange,
}) => {
  const add = () => onChange([...documentos, { tipo: "", numero: "" }]);
  const update = (
    index: number,
    patch: Partial<{ tipo: string; numero: string }>
  ) => {
    const clone = [...documentos];
    clone[index] = { ...clone[index], ...patch };
    onChange(clone);
  };
  const remove = (index: number) => {
    const clone = documentos.filter((_, i) => i !== index);
    onChange(clone);
  };
  return (
    <div className="space-y-3">
      {documentos.length === 0 && (
        <p className="text-xs text-gray-500">
          Nenhum documento extra adicionado.
        </p>
      )}
      {documentos.map((doc, i) => (
        <div key={i} className="flex gap-2 items-start">
          <select
            value={doc.tipo}
            onChange={(e) => update(i, { tipo: e.target.value })}
            className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Tipo</option>
            <option value="cnh">CNH</option>
            <option value="passaporte">Passaporte</option>
            <option value="rne">RNE</option>
            <option value="outro">Outro</option>
          </select>
          <input
            type="text"
            value={doc.numero}
            onChange={(e) => update(i, { numero: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Número"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-600 text-xs hover:underline"
          >
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="px-3 py-1.5 text-sm border border-dashed border-gray-400 rounded hover:bg-gray-50"
      >
        Adicionar documento
      </button>
    </div>
  );
};
