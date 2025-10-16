export interface PacienteBrief { 
  _id: string;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
}

export function listarPacientes(): Promise<PacienteBrief[]>;
export {};
