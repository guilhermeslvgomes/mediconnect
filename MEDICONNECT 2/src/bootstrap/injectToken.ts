// Auto-injeta o access token fornecido (uso DEV). Não usar em produção.
declare global {
  interface Window {
    __staticAuthToken?: string;
  }
}
const STATIC_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6ImJGVUlxQzNzazNjUms5RlMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3l1YW5xZnN3aGJlcmtvZXZ0bWZyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjN2ZjZDcwMi05YTZlLTRiN2MtYWJkMy05NTZiMjVhZjQwN2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5Mjg4Nzk2LCJpYXQiOjE3NTkyODUxOTYsImVtYWlsIjoicmlzZXVwQHBvcGNvZGUuY29tLmJyIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiUmlzZVVwIFBvcGNvZGUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1OTI4NTE5Nn1dLCJzZXNzaW9uX2lkIjoiNGZkNzVhZmItZjlmMS00YTI1LWIyODEtYWM5ODBhNWYwMTRiIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.Umu32IwsR2FtYqxuoHS2SAv2a_Ul8xzcvqPWpU9ckDA";

(function inject() {
  try {
    const existing = localStorage.getItem("authToken");
    if (existing !== STATIC_ACCESS_TOKEN) {
      localStorage.setItem("authToken", STATIC_ACCESS_TOKEN);
      localStorage.setItem("token", STATIC_ACCESS_TOKEN); // compat
      localStorage.setItem("authToken_injected_at", new Date().toISOString());
      window.__staticAuthToken = STATIC_ACCESS_TOKEN;
      console.info(
        "[injectToken] Token estático injetado. exp=1970+seconds raw exp claim, confira validade real."
      );
    }
  } catch (e) {
    console.warn("[injectToken] Falha ao injetar token:", e);
  }
})();

export {};
