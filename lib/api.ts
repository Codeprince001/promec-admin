import { useSession } from './session';
import type { PageMeta } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'ERROR', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type Options = RequestInit & { token?: string | null };

export async function api<T>(path: string, init: Options = {}): Promise<T> {
  return request<T>(path, init, true);
}

async function request<T>(path: string, init: Options, retry: boolean): Promise<T> {
  const token = init.token === undefined ? useSession.getState().token : init.token;
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  const json = await response.json().catch(() => null);
  if (response.status === 401 && retry && token && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
    const refreshed = await refreshAccess();
    if (refreshed) return request<T>(path, init, false);
  }
  if (!response.ok) {
    const message = json && typeof json === 'object' && 'error' in json
      ? (json as { error?: { message?: string; code?: string } }).error?.message
      : undefined;
    const code = json && typeof json === 'object' && 'error' in json
      ? (json as { error?: { code?: string } }).error?.code
      : undefined;
    throw new ApiError(message || 'The request failed', code || 'ERROR', response.status);
  }
  return json as T;
}

export async function refreshAccess() {
  const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  const json = await response.json().catch(() => null);
  const token = json && typeof json === 'object' && 'data' in json
    ? (json as { data?: { accessToken?: string } }).data?.accessToken
    : undefined;
  if (!response.ok || !token) {
    useSession.getState().setToken(null);
    return false;
  }
  useSession.getState().setToken(token);
  return true;
}

export async function get<T>(path: string): Promise<T> {
  const body = await api<{ data: T }>(path);
  return body.data;
}

export async function page<T>(path: string): Promise<{ rows: T[]; meta: PageMeta }> {
  const body = await api<{ data: T[]; meta?: PageMeta }>(path);
  return {
    rows: body.data ?? [],
    meta: body.meta ?? { page: 1, pageSize: body.data?.length ?? 0, total: body.data?.length ?? 0, totalPages: 1 },
  };
}

export async function send<T>(path: string, method = 'POST', body?: unknown): Promise<T> {
  const json = await api<{ data: T }>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return json.data;
}
