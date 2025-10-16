/**
 * Utilidade para carregar consultas de demonstração
 * Importar em qualquer componente que precise das consultas
 */

import consultasDemo from "../data/consultas-demo.json";

export interface ConsultaDemo {
  id: string;
  pacienteId: string;
  medicoId: string;
  pacienteNome: string;
  medicoNome: string;
  dataHora: string;
  status: string;
  tipo: string;
  observacoes: string;
}

/**
 * Carrega as consultas de demonstração no localStorage
 */
export function carregarConsultasDemo(): void {
  try {
    const consultasExistentes = localStorage.getItem("consultas_local");

    if (!consultasExistentes) {
      console.log("📊 Carregando consultas de demonstração...");
      localStorage.setItem("consultas_local", JSON.stringify(consultasDemo));
      console.log(`✅ ${consultasDemo.length} consultas carregadas!`);
    } else {
      // Mesclar com consultas existentes
      const existentes = JSON.parse(consultasExistentes);
      const ids = new Set(existentes.map((c: ConsultaDemo) => c.id));

      const novas = consultasDemo.filter((c) => !ids.has(c.id));

      if (novas.length > 0) {
        const mescladas = [...existentes, ...novas];
        localStorage.setItem("consultas_local", JSON.stringify(mescladas));
        console.log(`✅ ${novas.length} novas consultas adicionadas!`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao carregar consultas:", error);
  }
}

/**
 * Obtém as consultas de demonstração
 */
export function getConsultasDemo(): ConsultaDemo[] {
  return consultasDemo;
}

/**
 * Obtém consultas do paciente Guilherme
 */
export function getConsultasGuilherme(): ConsultaDemo[] {
  return consultasDemo.filter((c) => c.pacienteNome.includes("Guilherme"));
}

/**
 * Obtém consultas do médico Fernando
 */
export function getConsultasFernando(): ConsultaDemo[] {
  return consultasDemo.filter((c) => c.medicoNome.includes("Fernando"));
}

/**
 * Limpa todas as consultas do localStorage
 */
export function limparConsultas(): void {
  localStorage.removeItem("consultas_local");
  console.log("🗑️ Consultas removidas do localStorage");
}

/**
 * Recarrega as consultas de demonstração (sobrescreve)
 */
export function recarregarConsultasDemo(): void {
  localStorage.setItem("consultas_local", JSON.stringify(consultasDemo));
  console.log(`✅ ${consultasDemo.length} consultas recarregadas!`);
}

// Auto-carregar ao importar (opcional - pode comentar se não quiser)
if (typeof window !== "undefined") {
  // Carregar automaticamente apenas em desenvolvimento
  if (import.meta.env.DEV) {
    carregarConsultasDemo();
  }
}
