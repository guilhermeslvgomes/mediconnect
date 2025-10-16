// Bootstrap que inicializa o token técnico de serviço antes (ou em paralelo) ao carregamento da aplicação.
// Não bloqueamos o render; requisições iniciais podem receber 401 até o token chegar—mas o TokenManager tenta rápido.
import { initServiceAuth } from "../services/tokenManager";

void initServiceAuth();
