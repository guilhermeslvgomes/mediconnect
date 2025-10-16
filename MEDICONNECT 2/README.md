## MEDICONNECT – Documentação Técnica e de Segurança

Aplicação SPA (React + Vite + TypeScript) consumindo Supabase (Auth, PostgREST, Edge Functions). Este documento consolida: variáveis de ambiente, arquitetura de autenticação, modelo de segurança atual, riscos, controles implementados e próximos passos.

---

## 1. Variáveis de Ambiente (`.env` / `.env.local`)

| Variável                 | Obrigatória      | Descrição                                                       |
| ------------------------ | ---------------- | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Sim              | URL base do projeto Supabase (`https://<ref>.supabase.co`)      |
| `VITE_SUPABASE_ANON_KEY` | Sim              | Chave pública (anon) usada para Auth password grant e PostgREST |
| `VITE_APP_ENV`           | Não              | Identifica ambiente (ex: `dev`, `staging`, `prod`)              |
| `VITE_SERVICE_EMAIL`     | Não (desativado) | Email de usuário técnico (não usar em produção no momento)      |
| `VITE_SERVICE_PASSWORD`  | Não (desativado) | Senha do usuário técnico (não usar em produção no momento)      |

Boas práticas:

- Nunca exponha Service Role Key no frontend.
- Não comitar `.env` – usar `.env.example` como referência.

---

## 2. Arquitetura de Autenticação

Fluxo atual (somente usuários finais):

1. Usuário envia email+senha -> `authService.login` (POST `/auth/v1/token` grant_type=password).
2. Resposta: `access_token` (curto prazo) + `refresh_token` (longo prazo) armazenados em `localStorage` (decisão provisória).
3. Interceptor (`api.ts`) anexa `Authorization: Bearer <access_token>` e `apikey: <anon_key>`.
4. Em resposta 401: wrapper tenta Refresh (grant_type=refresh_token). Se falhar, força logout.
5. `GET /auth/v1/user` fornece user base; `GET /functions/v1/user-info` enriquece (roles, profile, permissions).

Edge Function de criação de usuário (`/functions/v1/create-user`) é tentada primeiro; fallback manual executa sequência: signup -> profile -> role -> domínio (ex: doctors/patients table).

Motivos para não usar (neste momento) TokenManager técnico:

- Elimina necessidade de usuário "service" exposto.
- RLS controla acesso por `auth.uid()` – fluxo permanece coerente.

---

## 3. Modelo de Autorização & Roles

Roles previstas: `admin`, `gestor`, `medico`, `secretaria`, `paciente`, `user`.

Camadas:

- Supabase Auth: autenticação e identidade (user.id).
- PostgREST + RLS: enforcement de linha/coluna (ex: paciente só vê seus próprios registros; médico vê pacientes atribuídos / futuras policies).
- Edge Functions: operações privilegiadas (criação de usuário composto; agregações que cruzam tabelas sensíveis).

Princípios:

- Menor privilégio: roles específicas são anexadas à tabela `user_roles` / claim custom (via função user-info).
- Expansão de permissões sempre via backend controlado (Edge ou admin interface separada).

---

## 4. Armazenamento de Tokens

Status revisado: Access Token agora em memória (via `tokenStore`), Refresh Token em `sessionStorage` (escopo aba). LocalStorage legado é migrado e limpo.

Motivações da mudança:

- Reduz superfície de ataque para XSS persistente (access token não persiste após reload se atacante injeta script tardio).
- Session scoping limita reutilização indevida do refresh token após fechamento total do navegador.

Persistência atual:
| Tipo | Local | Expiração Natural |
| -------------- | ----------------- | ------------------------------------ |
| Access Token | Memória JS | exp claim (curto prazo) |
| Refresh Token | sessionStorage | exp claim / revogação backend |
| User Snapshot | Memória JS | Limpo em logout / reload opcional |

Riscos remanescentes:

- XSS ainda pode ler refresh token dentro da mesma aba.
- Ataques supply-chain podem capturar tokens em runtime.

Mitigações planejadas:

1. CSP + bloqueio de inline script não autorizado.
2. Auditoria de dependências e lockfile imutável.
3. (Opcional) Migrar refresh para cookie httpOnly + rotacionamento curto (exige backend/proxy).

Fallback / Migração:

- Em primeira utilização o `tokenStore` migra chaves legacy (`authToken`, `refreshToken`, `authUser`) e remove do `localStorage`.

Operações:

- `tokenStore.setTokens(access, refresh?)` atualiza memória e session.
- `tokenStore.clear()` remove tudo (usado em logout e erro crítico de refresh).

Fluxo de Refresh:

1. Requisição falha com 401.
2. Wrapper (`http.ts`) obtém refresh do `tokenStore`.
3. Se sucesso, novo par é salvo (access renovado em memória, refresh substituído em session).
4. Se falha, limpeza e redirecionamento esperados pelo layer de UI.

Próximos passos (prioridade decrescente):

1. Testes e2e validando não persistência pós reload sem refresh.
2. Detecção de reuse (se Supabase expor sinalização) e invalidação proativa.
3. Adicionar heurística antiflood de refresh (backoff exponencial).

---

## 5. Regras de Segurança no Banco (RLS)

Dependemos de Row Level Security para proteger dados. A aplicação pressupõe policies:

- Tabelas de domínio (patients, doctors) filtradas por `auth.uid()` (ex: patient.id = auth.uid()).
- Tabela de roles apenas legível para o próprio usuário e roles administrativas.
- Operações de escrita restritas ao proprietário ou a roles privilegiadas.

Checklist a validar (fora do front):
[] Policies para SELECT/INSERT/UPDATE/DELETE em cada tabela sensível.
[] Policies específicas para evitar enumerar usuários (ex: `profiles`).
[] Remoção de permissões públicas redundantes.

---

## 6. Edge Functions

Usadas para:

- `user-info`: agrega roles + profile + permissões derivadas.
- `create-user`: fluxo atômico de criação (signup + role + domínio) quando disponível.

Critérios para mover lógica para Edge:

- Necessidade de Service Role Key (não pode ir ao front).
- Lógica multi-tabela que exige atomicidade e validação adicional.
- Redução de round-trips (performance e consistência).

---

## 7. Decisão: Proxy Backend (A Avaliar)

Status: NÃO implementado.

Quando justificar criar proxy:
| Cenário | Benefício do Proxy |
|---------|--------------------|
| Necessidade de Service Role | Segredo fora do client |
| Orquestração complexa >1 função | Transações / consistência |
| Rate limiting custom | Proteção anti-abuso |
| Auditoria centralizada | Logs correlacionados |

Custos de um proxy:

- Latência adicional.
- Manutenção (deploy, uptime, patches de segurança).
- Duplicação parcial de capacidades já cobertas por RLS.

Decisão atual: permanecer sem proxy até surgir necessidade concreta (service role / complexidade). Reavaliar trimestralmente.

---

## 8. Hardening do Cliente

Implementado:

- Interceptor único normaliza erros e tenta 1 refresh controlado.
- Remoção de tokens técnicos persistidos.
- Remoção de senha do domínio (ex: `MedicoCreate`).

Planejado:

- Content Security Policy estrita (nonce ou hashes para scripts inline).
- Sanitização consistente para HTML dinâmico (não inserir dangerouslySetInnerHTML sem validação).
- Substituir localStorage por memória + fallback volátil.
- Feature Policy / Permissions Policy (desabilitar sensores não usados).
- SRI (Subresource Integrity) para libs CDN (se adotadas no futuro).

---

## 9. Logging & Observabilidade

Diretrizes:

- Nunca logar tokens ou refresh tokens.
- Em produção, anonimizar IDs sensíveis onde possível (hash irreversível).
- Separar logs de segurança (auth failures, tentativas repetidas) de logs de aplicação.

Próximo passo: Implementar adaptador de log (console wrapper) com níveis + redaction de padrões (regex para JWT / emails).

---

## 10. Tratamento de Erros

Wrapper `http` fornece shape padronizado `ApiResponse<T>`.
Princípios:

- Não propagar stack trace de servidor ao usuário final.
- Exibir mensagem genérica em 5xx; detalhada em 4xx previsível (ex: validação).
- Em 401 após falha de refresh -> limpar sessão e redirecionar login.

---

## 11. Ameaças Principais & Contramedidas

| Ameaça                 | Vetor                       | Contramedida Atual                     | Próximo Passo                             |
| ---------------------- | --------------------------- | -------------------------------------- | ----------------------------------------- |
| XSS persistente        | Input não sanitizado        | Sem campos com HTML arbitrário         | CSP + sanitização + remover localStorage  |
| Token theft            | XSS / extensão maliciosa    | Sem service role key                   | Migrar tokens p/ memória                  |
| Enumeração de usuários | Erros detalhados em login   | Mensagem genérica                      | Rate limit + monitorar padrões            |
| Escalada de privilégio | Manipular roles client-side | Roles derivadas no backend (user-info) | Policies de atualização de roles estritas |
| Replay refresh token   | Interceptação               | TLS + troca de token no refresh        | Reduzir lifetime e detectar reuse         |

---

## 12. Roadmap de Segurança (Prioridade)

1. (P1) Migrar tokens para memória + session fallback.
2. (P1) Validar/Documentar RLS efetiva para cada tabela.
3. (P2) Implementar logging redaction adapter.
4. (P2) CSP + lint anti `dangerouslySetInnerHTML`.
5. (P3) Mecanismo de invalidação global de sessão (revogar refresh em logout server-side se necessário).
6. (P3) Testes automatizados de rota protegida (e2e smoke).

---

## 13. Serviços Atuais (Resumo)

| Domínio         | Arquivo                  | Observações                                                |
| --------------- | ------------------------ | ---------------------------------------------------------- |
| Autenticação    | `authService.ts`         | login, logout, refresh, user-info, getCurrentAuthUser      |
| Médicos         | `medicoService.ts`       | CRUD + remoção de password do payload                      |
| Pacientes       | `pacienteService.ts`     | Listagem/CRUD com normalização                             |
| Roles           | `userRoleService.ts`     | list/assign/delete                                         |
| Criação Usuário | `userCreationService.ts` | Edge first fallback manual                                 |
| Relatórios      | (planejado)              | Pendende confirmar implementação real (`reportService.ts`) |
| Consultas       | (planejado)              | Padronizar nome tabela (`consultas` vs `consultations`)    |
| SMS             | `smsService.ts`          | Placeholder                                                |

Arquivos legados/deprecados destinados a remoção após verificação de ausência de imports: `consultaService.ts`, `relatorioService.ts`, `listarPacientes.*`, `pacientes.js`, `api.js`.

---

## 14. Convenções de Código

- DB `snake_case` -> front `camelCase`.
- Limpeza de campos `undefined` antes de mutações (evita null overwrites).
- Requisições POST/PUT/PATCH com `Prefer: return=representation` quando necessário.
- ApiResponse<T>: `{ success: boolean, data?: T, error?: string, message?: string }`.

---

## 15. Scripts Básicos

Instalação:

```
pnpm install
```

Dev:

```
pnpm dev
```

Build:

```
pnpm build
```

---

## 16. Estrutura Simplificada

```
src/
  services/
  pages/
  components/
  entities/
```

---

## 17. Próximos Passos Técnicos (Geral)

- Implementar serviços faltantes (reports/consultas) alinhados ao padrão http wrapper.
- Testes unitários dos mapeadores (medico/paciente) e do fluxo de refresh.
- Avaliar substituição de localStorage (Roadmap P1).
- Revisar necessidade de proxy a cada trimestre (documentar decisão em CHANGELOG/ADR).

---

## 18. Desenvolvimento: Tipagem, Validação e Testes

### 18.1 Geração de Tipos a partir do OpenAPI

Arquivo da especificação parcial: `docs/api/openapi.partial.json`

Gerar (ou regenerar) os tipos TypeScript:

```
pnpm gen:api-types
```

Resultado: `src/types/api.d.ts` (não editar manualmente). Atualize o spec antes de regenerar.

Fluxo para adicionar/alterar endpoints:

1. Editar `openapi.partial.json` (paths / schemas).
2. Rodar `pnpm gen:api-types`.
3. Ajustar services para usar novos tipos (`components["schemas"]["<Nome>"]`).
4. Adicionar/atualizar validação Zod (se aplicável).
5. Criar ou atualizar testes.

### 18.2 Schemas de Validação (Zod)

Arquivo central: `src/validation/schemas.ts`

Inclui:

- `loginSchema`
- `patientInputSchema` + mapper `mapPatientFormToApi`
- `doctorCreateSchema` / `doctorUpdateSchema`
- `reportInputSchema` + mapper `mapReportFormToApi`

Boas práticas:

- Validar antes de chamar service.
- Usar mapper para manter isolamento entre modelo de formulário e payload API (snake_case).
- Adicionar novos schemas aqui ou dividir em módulos se crescer (ex: `validation/patient.ts`).

### 18.3 Testes (Vitest)

Config: `vitest.config.ts`

Scripts:

```
pnpm test        # execução única
pnpm test:watch  # modo watch
```

Suites atuais:

- `patient.mapping.test.ts`: mapeamento form -> API
- `doctor.schema.test.ts`: normalização de UF, campos obrigatórios
- `report.schema.test.ts`: payload mínimo e erros

Adicionar novo teste:

1. Criar arquivo em `src/tests/*.test.ts`.
2. Importar schema/service a validar.
3. Cobrir pelo menos 1 caso feliz e 1 caso de erro.

### 18.4 Padrões de Services

Cada service deve:

- Usar tipos gerados (`components["schemas"]`) para payload/response quando possível.
- Encapsular mapeamentos snake_case -> camelCase em funções privadas (ex: `mapReport`).
- Limpar chaves com valor `undefined` antes de enviar (já adotado em pacientes/relatórios).
- Emitir `{ success, data?, error? }` uniformemente.

### 18.5 Endpoints de Arquivos (Foto / Anexos Paciente)

Formalizados na spec com uploads `multipart/form-data`:

- `/auth/v1/pacientes/{id}/foto` (POST/DELETE)
- `/auth/v1/pacientes/{id}/anexos` (GET/POST)
- `/auth/v1/pacientes/{id}/anexos/{anexoId}` (DELETE)

Quando backend estabilizar response detalhado (ex: tipos MIME), atualizar schema `PacienteAnexo` e regenerar tipos.

### 18.6 Validação de CPF

Endpoint `/pacientes/validar-cpf` retorna schema `ValidacaoCPF`:

```
{
  "valido": boolean,
  "existe": boolean,
  "paciente_id": string | null
}
```

Integração: usar antes de criar paciente para alertar duplicidade.

### 18.7 Checklist ao Criar Novo Recurso

1. Definir schema no OpenAPI (entrada + saída).
2. Gerar tipos (`pnpm gen:api-types`).
3. Criar service com wrappers padronizados.
4. Adicionar Zod schema (form/input).
5. Criar testes (mínimo: validação + mapeamento).
6. Atualizar README (se conceito novo).
7. Verificar se precisa RLS/policy nova no backend.

### 18.8 Futuro: Automação CI

Pipeline desejado:

- Lint → Build → Test → (Gerar tipos e verificar diff do `api.d.ts`) → Deploy.
- Falhar se `docs/api/openapi.partial.json` mudou sem `api.d.ts` regenerado.

---

## 19. Referência Rápida

| Ação                   | Comando                            |
| ---------------------- | ---------------------------------- |
| Instalar deps          | `pnpm install`                     |
| Dev server             | `pnpm dev`                         |
| Build                  | `pnpm build`                       |
| Gerar tipos API        | `pnpm gen:api-types`               |
| Rodar testes           | `pnpm test`                        |
| Testes em watch        | `pnpm test:watch`                  |
| Atualizar spec + tipos | editar spec → `pnpm gen:api-types` |

---

## 19.1 Acessibilidade (A11y)

Recursos implementados para melhorar usabilidade, leitura e inclusão:

### Preferências do Usuário

Gerenciadas via hook `useAccessibilityPrefs` (localStorage, chave única `accessibility-prefs`). As opções persistem entre sessões e são aplicadas ao elemento `<html>` como classes utilitárias.

| Preferência        | Chave interna   | Classe aplicada     | Efeito Principal                                 |
| ------------------ | --------------- | ------------------- | ------------------------------------------------ |
| Tamanho da Fonte   | `fontSize`      | (inline style root) | Escala tipográfica global                        |
| Modo Escuro        | `darkMode`      | `dark`              | Ativa tema dark Tailwind                         |
| Alto Contraste     | `highContrast`  | `high-contrast`     | Contraste forte (cores simplificadas)            |
| Fonte Disléxica    | `dyslexicFont`  | `dyslexic-font`     | Aplica fonte OpenDyslexic (fallback legível)     |
| Espaçamento Linhas | `lineSpacing`   | `line-spacing`      | Aumenta `line-height` em blocos de texto         |
| Reduzir Movimento  | `reducedMotion` | `reduced-motion`    | Remove / suaviza animações não essenciais        |
| Filtro Luz Azul    | `lowBlueLight`  | `low-blue-light`    | Tonalidade quente para conforto visual noturno   |
| Modo Foco          | `focusMode`     | `focus-mode`        | Atenua elementos fora de foco (leitura seletiva) |
| Leitura de Texto   | `textToSpeech`  | (sem classe)        | TTS por hover (limite 180 chars)                 |

Atalho de teclado: `Alt + A` abre/fecha o menu de acessibilidade. `Esc` fecha quando aberto.

### Componente `AccessibilityMenu`

- Dialog semântico com `role="dialog"`, `aria-modal="true"`, foco inicial e trap de tab.
- Botões toggle com `aria-pressed` e feedback textual auxiliar.
- Reset central limpa preferências e cancela síntese de fala ativa.

### Formulários

- Todos os campos críticos com `id` + `label` associada.
- Atributos `autoComplete` coerentes (ex: `email`, `name`, `postal-code`, `bday`, `new-password`).
- Padrões (`pattern`) e `inputMode` para CPF, CEP, telefone, DDD, números.
- `aria-invalid` + mensagens condicionais (ex: confirmação de senha divergente).
- Normalização para envio (CPF/telefone/cep) realizada no service antes do request (sem formatação).

### Tabela de Pacientes

- Usa `scope="col"` nos cabeçalhos, suporte dark mode, indicador VIP com `aria-label`.

### Temas & CSS

Classes utilitárias adicionadas em `index.css` permitindo expansão futura sem alterar componentes. O design evita uso de inline style exceto na escala de fonte global, facilitando auditoria e CSP.

### Boas Práticas Futuras

1. Adicionar detecção automática de `prefers-reduced-motion` para estado inicial.
2. Implementar fallback de TTS selecionável por foco + tecla (reduzir leitura acidental).
3. Testes automatizados de acessibilidade (axe-core) e verificação de contraste.
4. Suporte a aumentar espaçamento de letras (letter-spacing) opcional.

---

### 19.2 Testes de Acessibilidade & Fallback de Render (Status Temporário)

Resumo do Problema:
Durante a criação de testes de interface para o `AccessibilityMenu`, o ambiente de testes (Vitest + jsdom e também `happy-dom`) deixou de materializar a árvore DOM de componentes React – inclusive para um componente mínimo (`<div>Hello</div>`). Não houve erros de compilação nem warnings relevantes, apenas `container.innerHTML === ''` após `render(...)`.

Hipóteses já investigadas (sem sucesso):

- Troca de `@vitejs/plugin-react-swc` por `@vitejs/plugin-react` (padrão Babel) + pin de versão do Vite (5.4.10).
- Alternância de ambiente (`jsdom` -> `happy-dom`).
- Remoção/isolamento de ícones (`lucide-react`) e libs auxiliares (mock de `@axe-core/react`).
- Render manual via `createRoot` e flush de microtasks.
- Ajustes de transform / esbuild jsx automatic.

Decisão Temporária (para garantir “teste que funciona”):

1. Marcar suites unitárias dependentes de render React como `describe.skip` enquanto a causa raiz é isolada.
2. Introduzir um teste E2E real em browser (Puppeteer) que valida a funcionalidade essencial do menu.

Arquivos Impactados:

- Skipped (com TODO):
  - `src/__tests__/accessibilityMenu.semantic.test.tsx`
  - `src/__tests__/miniRender.test.tsx`
  - `src/__tests__/manualRootRender.test.tsx`
- Novo teste E2E:
  - `src/__tests__/accessibilityMenu.e2e.test.ts`

Script E2E:

```
pnpm test:e2e-menu
```

O teste:

1. Sobe (ou reutiliza) o dev server Vite (porta 5173).
2. Abre a SPA no Chromium headless.
3. Clica no botão do menu de acessibilidade.
4. Verifica presença do diálogo (role="dialog") e depois fecha.

Critério de Aceite Provisório:
Enquanto o bug de render unitário persistir, a cobertura de comportamento crítico do menu é garantida pelo teste E2E (abre, foca, fecha). As preferências de acessibilidade continuam cobertas por testes unitários puros (sem render React) onde aplicável.

Próximos Passos para Retomar Testes Unitários:

1. Criar reprodutor mínimo externo (novo repo) com dependências congeladas para confirmar se é interação específica local.
2. Rodar `pnpm ls --depth 0` e comparar versões de `react`, `react-dom`, `@types/react`, `vitest`, `@vitejs/plugin-react`.
3. Forçar transpile isolado de um teste (`vitest --run --no-threads --dom`) para descartar interferência de thread pool.
4. Se persistir, habilitar logs detalhados de Vite (`DEBUG=vite:*`) e inspecionar saída transformada de um teste simples.
5. Reintroduzir gradativamente (mini -> menu) removendo mocks temporários.

Quando Corrigir:

- Remover skips (`describe.skip`).
- Reativar (opcional) auditoria `axe-core` com `@axe-core/react`.
- Documentar causa raiz aqui (ex: conflito de plugin, polyfill global, etc.).

Risco Residual:
Falhas específicas de acessibilidade sem cobertura E2E mais profunda (ex: foco cíclico em condições de teclado complexas) podem passar. Mitigação: expandir cenários E2E após estabilizar ambiente unitário.

Estado Atual: Fallback E2E ativo e validado. (Atualizar este bloco quando o pipeline unitário React estiver normalizado.)

---

---

## 18. ADRs (Decisões Arquiteturais) Resumidas

| ID      | Decisão                                       | Status | Justificativa                              |
| ------- | --------------------------------------------- | ------ | ------------------------------------------ |
| ADR-001 | Sem proxy backend inicial                     | Ativo  | RLS + Edge Functions suficientes agora     |
| ADR-002 | Tokens em memória + refresh em sessionStorage | Ativo  | Redução de risco XSS mantendo simplicidade |
| ADR-003 | Criação de usuário via Edge fallback manual   | Ativo  | Resiliência caso função indisponível       |

Registrar novas decisões futuras em uma pasta `docs/adr`.

---

## 19. Checklist de Release (Segurança)

[] Remover credenciais de desenvolvimento do README / código.
[] Validar CSP ativa no ambiente (report-only -> enforce).
[] Executar análise de dependências (npm audit / pnpm audit) e corrigir críticas.
[] Verificar que nenhum token aparece em logs.
[] Confirmar policies RLS completas.

---

## 20. Notas Finais

Este documento substitui versões anteriores e consolida segurança + operação. Atualize sempre que fluxos críticos mudarem (auth, roles, storage de tokens, Edge Functions novas).

---

Última atualização: (manter manualmente) 2025-10-03.

---

## 21. Logging Centralizado & Redaction

Implementado `logger.ts` substituindo gradualmente `console.*`.

Características:

- Níveis: debug, info, warn, error.
- Redação automática de:
  - Padrões de JWT (três segmentos base64url).
  - Campos com `token`, `password`, `secret`, `email`.
  - Emails em strings.
- Nível dinâmico: produção => `info+`, demais => `debug`.

Uso:

```
import { logger } from 'src/services/logger';
logger.info('login success', { userId });
```

Práticas recomendadas:

- Não logar payloads completos com PII.
- Remover valores sensíveis antes de enviar para meta.
- Usar `error` somente para falhas não recuperáveis ou que exigem telemetria.

Backlog de logging:

- Adicionar transporte opcional (Sentry / Logtail).
- Exportar métricas (Prometheus / OTEL) para 401s e latência.

Status adicional:

- Mascaramento de CPF implementado (`***CPF***XX`).
- Contador global de 401 consecutivos com limite (3) antes de limpeza forçada de sessão.

---

## 22. Política CSP (Rascunho)

Objetivo: mitigar XSS e exfiltração de contexto.

Cabeçalho sugerido (Report-Only inicial):

```
Content-Security-Policy-Report-Only: \
  default-src 'self'; \
  script-src 'self' 'strict-dynamic' 'nonce-<nonce-value>' 'unsafe-inline'; \
  style-src 'self' 'unsafe-inline'; \
  img-src 'self' data: blob:; \
  font-src 'self'; \
  connect-src 'self' https://*.supabase.co; \
  frame-ancestors 'none'; \
  base-uri 'self'; \
  form-action 'self'; \
  object-src 'none'; \
  upgrade-insecure-requests; \
  report-uri https://example.com/csp-report
```

Adoção:

1. Aplicar em modo report-only (Netlify / edge) e coletar violações.
2. Eliminar dependências inline e remover `'unsafe-inline'`.
3. Adicionar hashes/nonce definitivos.
4. Migrar para modo enforce.

Complementos:

- Lint contra `dangerouslySetInnerHTML` sem sanitização.
- Biblioteca de sanitização (ex: DOMPurify) caso HTML dinâmico seja necessário.

---

## 23. Contador de 401 Consecutivos

Mecânica:

- Cada resposta final 401 (sem refresh bem-sucedido) incrementa contador global.
- Sucesso de requisição ou refresh resetam o contador.
- Ao atingir 3, sessão é limpa (`tokenStore.clear()`) e próximo acesso exigirá novo login.

Racional: evitar loops silenciosos de requisições falhando e reduzir superfície de brute force de refresh.

Parâmetros:

- Limite atual: 3 (configurável em `src/services/authConfig.ts`).

---

## 24. Verificação de Drift do OpenAPI

Script: `pnpm check:api-drift`

Fluxo CI recomendado:

1. Rodar `pnpm check:api-drift`.
2. Se falhar, forçar desenvolvedor a executar `pnpm gen:api-types` e commitar.

Implementação: gera tipos em memória via `openapi-typescript` e compara com `src/types/api.d.ts` normalizando quebras de linha.

---

## 25. Mascaramento de CPF no Logger

Padrão suportado: 11 dígitos com ou sem formatação (`000.000.000-00`).
Saída: `***CPF***00` (mantendo apenas os dois últimos dígitos para correlação mínima).

Objetivo: evitar exposição de identificador completo em logs persistentes.
