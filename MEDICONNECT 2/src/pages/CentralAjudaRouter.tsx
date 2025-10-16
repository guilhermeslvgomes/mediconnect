import React from "react";
import { useAuth } from "../hooks/useAuth";
import CentralAjuda from "./CentralAjuda";
import CentralAjudaMedico from "./CentralAjudaMedico";

const CentralAjudaRouter: React.FC = () => {
  const { user } = useAuth();

  // Se for médico, gestor ou admin, mostra a central de ajuda para médicos
  const isMedico =
    user?.role && ["medico", "gestor", "admin"].includes(user.role);

  return isMedico ? <CentralAjudaMedico /> : <CentralAjuda />;
};

export default CentralAjudaRouter;
