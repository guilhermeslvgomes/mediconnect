import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  dataHora: string;
  status: string;
  tipo?: string;
  motivo?: string;
  observacoes?: string;
  valorPago?: number;
  formaPagamento?: string;
  created_at?: string;
  updated_at?: string;
}

// Store em memória (temporário - em produção use Supabase ou outro DB)
const consultas: Consulta[] = [];

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  void context; // not used currently
  const path = event.path.replace("/.netlify/functions/consultas", "");
  const method = event.httpMethod;

  try {
    // LIST - GET /consultas
    if (method === "GET" && !path) {
      const queryParams = event.queryStringParameters || {};
      let resultado = [...consultas];

      // Filtrar por pacienteId
      if (queryParams.patient_id) {
        const patientId = queryParams.patient_id.replace("eq.", "");
        resultado = resultado.filter((c) => c.pacienteId === patientId);
      }

      // Filtrar por medicoId
      if (queryParams.doctor_id) {
        const doctorId = queryParams.doctor_id.replace("eq.", "");
        resultado = resultado.filter((c) => c.medicoId === doctorId);
      }

      // Filtrar por status
      if (queryParams.status) {
        const status = queryParams.status.replace("eq.", "");
        resultado = resultado.filter((c) => c.status === status);
      }

      // Limit
      if (queryParams.limit) {
        const limit = parseInt(queryParams.limit);
        resultado = resultado.slice(0, limit);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(resultado),
      };
    }

    // GET BY ID - GET /consultas/:id
    if (method === "GET" && path.match(/^\/[^/]+$/)) {
      const id = path.substring(1);
      const consulta = consultas.find((c) => c.id === id);

      if (!consulta) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Consulta não encontrada" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(consulta),
      };
    }

    // CREATE - POST /consultas
    if (method === "POST" && !path) {
      const body = JSON.parse(event.body || "{}");
      const novaConsulta: Consulta = {
        id: crypto.randomUUID(),
        pacienteId: body.pacienteId,
        medicoId: body.medicoId,
        dataHora: body.dataHora,
        status: body.status || "agendada",
        tipo: body.tipo,
        motivo: body.motivo,
        observacoes: body.observacoes,
        valorPago: body.valorPago,
        formaPagamento: body.formaPagamento,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      consultas.push(novaConsulta);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(novaConsulta),
      };
    }

    // UPDATE - PATCH /consultas/:id
    if ((method === "PATCH" || method === "PUT") && path.match(/^\/[^/]+$/)) {
      const id = path.substring(1);
      const index = consultas.findIndex((c) => c.id === id);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Consulta não encontrada" }),
        };
      }

      const body = JSON.parse(event.body || "{}");
      consultas[index] = {
        ...consultas[index],
        ...body,
        id, // Não permitir alterar ID
        updated_at: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(consultas[index]),
      };
    }

    // DELETE - DELETE /consultas/:id
    if (method === "DELETE" && path.match(/^\/[^/]+$/)) {
      const id = path.substring(1);
      const index = consultas.findIndex((c) => c.id === id);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Consulta não encontrada" }),
        };
      }

      consultas.splice(index, 1);

      return {
        statusCode: 204,
        headers,
        body: "",
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Rota não encontrada" }),
    };
  } catch (error) {
    console.error("Erro na função consultas:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

export { handler };
