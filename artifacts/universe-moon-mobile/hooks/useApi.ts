import { useAuth } from "@/context/auth";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export function useApi() {
  const { sessionToken } = useAuth();

  function authHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
    if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;
    return headers;
  }

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || `Error ${res.status}`);
    }
    return res.json();
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || `Error ${res.status}`);
    }
    return res.json();
  }

  async function del<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || `Error ${res.status}`);
    }
    return res.json();
  }

  return { get, post, del, authHeaders, baseUrl: BASE_URL };
}
