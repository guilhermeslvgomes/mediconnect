import React, { useState, useEffect, useRef } from "react";
import { User, Stethoscope, Clipboard, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { i18n } from "../i18n";
import { telemetry } from "../services/telemetry";
import { useAuth } from "../hooks/useAuth";

export type ProfileType = "patient" | "doctor" | "secretary" | null;

interface ProfileOption {
  type: ProfileType;
  icon: typeof User;
  label: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
}

const profileOptions: ProfileOption[] = [
  {
    type: "patient",
    icon: User,
    label: i18n.t("profiles.patient"),
    description: i18n.t("profiles.patientDescription"),
    path: "/paciente",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  {
    type: "doctor",
    icon: Stethoscope,
    label: i18n.t("profiles.doctor"),
    description: i18n.t("profiles.doctorDescription"),
    path: "/login-medico",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
  },
  {
    type: "secretary",
    icon: Clipboard,
    label: i18n.t("profiles.secretary"),
    description: i18n.t("profiles.secretaryDescription"),
    path: "/login-secretaria",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
];

export const ProfileSelector: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Carregar perfil salvo
    const saved = localStorage.getItem(
      "mediconnect_selected_profile"
    ) as ProfileType;
    if (saved) {
      setSelectedProfile(saved);
    }
  }, []);

  useEffect(() => {
    // Fechar ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileSelect = (profile: ProfileOption) => {
    const previousProfile = selectedProfile;

    setSelectedProfile(profile.type);
    setIsOpen(false);

    // Persistir escolha
    if (profile.type) {
      localStorage.setItem("mediconnect_selected_profile", profile.type);
    }

    // Telemetria
    telemetry.trackProfileChange(previousProfile, profile.type || "none");

    // Navegar - condicional baseado em autenticação e role
    let targetPath = profile.path; // default: caminho do perfil (login)

    if (isAuthenticated && user) {
      // Se autenticado, redirecionar para o painel apropriado baseado na role
      switch (user.role) {
        case "paciente":
          if (profile.type === "patient") {
            targetPath = "/acompanhamento"; // painel do paciente
          }
          break;
        case "medico":
          if (profile.type === "doctor") {
            targetPath = "/painel-medico"; // painel do médico
          }
          break;
        case "secretaria":
          if (profile.type === "secretary") {
            targetPath = "/painel-secretaria"; // painel da secretária
          }
          break;
        case "admin":
          // Admin pode ir para qualquer painel
          if (profile.type === "secretary") {
            targetPath = "/painel-secretaria";
          } else if (profile.type === "doctor") {
            targetPath = "/painel-medico";
          } else if (profile.type === "patient") {
            targetPath = "/acompanhamento";
          }
          break;
      }

      console.log(
        `🔀 ProfileSelector: Usuário autenticado (${user.role}), redirecionando para ${targetPath}`
      );
    } else {
      console.log(
        `🔀 ProfileSelector: Usuário NÃO autenticado, redirecionando para ${targetPath}`
      );
    }

    navigate(targetPath);
  };

  const getCurrentProfile = () => {
    return profileOptions.find((p) => p.type === selectedProfile);
  };

  const currentProfile = getCurrentProfile();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          currentProfile
            ? `${currentProfile.bgColor} ${currentProfile.color}`
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={i18n.t("header.selectProfile")}
      >
        {currentProfile ? (
          <>
            <currentProfile.icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">{currentProfile.label}</span>
          </>
        ) : (
          <>
            <User className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">{i18n.t("header.profile")}</span>
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {i18n.t("header.selectProfile")}
            </p>
            {profileOptions.map((profile) => (
              <button
                key={profile.type}
                onClick={() => handleProfileSelect(profile)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  profile.type === selectedProfile
                    ? `${profile.bgColor} ${profile.color}`
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                role="menuitem"
                aria-label={`Selecionar perfil ${profile.label}`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    profile.type === selectedProfile
                      ? "bg-white"
                      : profile.bgColor
                  }`}
                >
                  <profile.icon
                    className={`w-5 h-5 ${profile.color}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{profile.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {profile.description}
                  </p>
                </div>
                {profile.type === selectedProfile && (
                  <div className="flex-shrink-0 pt-1">
                    <svg
                      className={`w-5 h-5 ${profile.color}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
