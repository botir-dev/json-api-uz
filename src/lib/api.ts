// ─────────────────────────────────────────────────────────────────────────────
// json-api — Backend API Client
// Base URL: https://api-backend-x89g.onrender.com
//
// Backend response format (response.ts):
//   ok()      → { success: true, data: T, traceId, timestamp }
//   created() → { success: true, data: T, traceId, timestamp } (201)
//   paginate()→ { success: true, data: T[], meta: { total, page, limit, totalPages, hasNext, hasPrev } }
//   error     → { success: false, error: { code, message }, traceId, timestamp }
//   204       → empty body (noContent)
// ─────────────────────────────────────────────────────────────────────────────

export const BASE = "https://api-backend-x89g.onrender.com";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getTenantSlug(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tenantSlug") || "";
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = "ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Core fetch wrapper — extracts data from { success, data } envelope
async function req<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status}`;
    throw new ApiError(
      typeof msg === "string" ? msg : JSON.stringify(msg),
      res.status,
      json?.error?.code || "ERROR"
    );
  }

  // Backend wraps everything in { success: true, data: ... }
  // paginate also adds meta alongside data
  return json.data as T;
}

// Paginated response helper — returns data + meta together
async function reqPaginated<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `HTTP ${res.status}`;
    throw new ApiError(
      typeof msg === "string" ? msg : JSON.stringify(msg),
      res.status,
      json?.error?.code || "ERROR"
    );
  }

  return {
    data: json.data as T[],
    meta: json.meta || { total: 0, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TENANTS
// POST /tenants  → data: { id, name, slug, plan }
// GET  /tenants/:slug → data: { id, name, slug, plan, settings, created_at }
// GET  /tenants/:slug/stats → data: { users, collections, requests30d }
// ─────────────────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings?: Record<string, unknown>;
  created_at?: string;
}

export const tenants = {
  create: (name: string, plan = "free") =>
    req<{ id: string; name: string; slug: string; plan: string }>(
      "/tenants",
      { method: "POST", body: JSON.stringify({ name, plan }) },
      false
    ),

  get: (slug: string) =>
    req<Tenant>(`/tenants/${slug}`),

  stats: (slug: string) =>
    req<{ users: number; collections: number; requests30d: number }>(
      `/tenants/${slug}/stats`
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// POST /auth/register   body: { email, password, name?, tenantSlug }
//   → data: { id, email, message }
//
// POST /auth/login      body: { email, password, tenantSlug }
//   → data: { accessToken, refreshToken, expiresIn, user: { id, email } }
//      OR   { requires2FA: true, tempToken }
//
// POST /auth/refresh    body: { refreshToken }
//   → data: { accessToken, expiresIn }
//
// POST /auth/logout     body: { refreshToken? }  (requireAuth header)
//   → data: { message }
//
// GET  /auth/me         (requireAuth)
//   → data: { id, email, full_name, avatar_url, email_verified, created_at, roles[] }
//
// POST /auth/totp/setup   (requireAuth) → data: { secret, qrCode }
// POST /auth/totp/confirm (requireAuth) body: { code } → data: { message }
// POST /auth/totp/verify  body: { code, tempToken } → data: { accessToken, refreshToken, expiresIn }
// ─────────────────────────────────────────────────────────────────────────────
export interface Me {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  roles: string[];
}

export interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: { id: string; email: string };
  requires2FA?: boolean;
  tempToken?: string;
}

export const auth = {
  register: (email: string, password: string, tenantSlug: string, name?: string) =>
    req<{ id: string; email: string; message: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, tenantSlug, name }) },
      false
    ),

  login: (email: string, password: string, tenantSlug: string) =>
    req<LoginResult>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password, tenantSlug }) },
      false
    ),

  refresh: (refreshToken: string) =>
    req<{ accessToken: string; expiresIn: number }>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      false
    ),

  logout: (refreshToken?: string) =>
    req<{ message: string }>(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refreshToken }) }
    ),

  me: () => req<Me>("/auth/me"),

  totpSetup: () =>
    req<{ secret: string; qrCode: string }>("/auth/totp/setup", { method: "POST" }),

  totpConfirm: (code: string) =>
    req<{ message: string }>("/auth/totp/confirm", {
      method: "POST", body: JSON.stringify({ code }),
    }),

  totpVerify: (code: string, tempToken: string) =>
    req<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      "/auth/totp/verify",
      { method: "POST", body: JSON.stringify({ code, tempToken }) },
      false
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// POST /:slug/collections/schema   body: { name, displayName, fields[] }
//   → data: { name, displayName, fields, tableName }
// GET  /:slug/collections/schema   → data: Collection[]
// DELETE /:slug/collections/schema/:name → 204
//
// GET  /:slug/collections/:name    query: page,limit,sort,order,search,filter
//   → paginated: data: Record[], meta: { total, page, limit, totalPages }
// POST /:slug/collections/:name    body: field values → data: Record
// GET  /:slug/collections/:name/:id → data: Record
// PUT  /:slug/collections/:name/:id body: fields → data: Record
// PATCH/:slug/collections/:name/:id body: partial → data: Record
// DELETE /:slug/collections/:name/:id → 204
// POST /:slug/collections/:name/bulk body: { operation, records[] }
//   → data: { affected, records[] }
// ─────────────────────────────────────────────────────────────────────────────
export interface Field {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "datetime" | "json" | "array" | "relation" | "file";
  required?: boolean;
  unique?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  display_name: string;
  schema_def: { fields: Field[] };
  created_at: string;
}

export const collections = {
  createSchema: (name: string, displayName: string, fields: Field[]) =>
    req<{ name: string; displayName: string; fields: Field[]; tableName: string }>(
      `/${getTenantSlug()}/collections/schema`,
      { method: "POST", body: JSON.stringify({ name, displayName, fields }) }
    ),

  listSchemas: () =>
    req<Collection[]>(`/${getTenantSlug()}/collections/schema`),

  deleteSchema: (name: string) =>
    req<void>(`/${getTenantSlug()}/collections/schema/${name}`, { method: "DELETE" }),

  list: (name: string, params?: { page?: number; limit?: number; sort?: string; order?: string; search?: string; filter?: object }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.sort) q.set("sort", params.sort);
    if (params?.order) q.set("order", params.order);
    if (params?.search) q.set("search", params.search);
    if (params?.filter) q.set("filter", JSON.stringify(params.filter));
    return reqPaginated<Record<string, unknown>>(
      `/${getTenantSlug()}/collections/${name}?${q.toString()}`
    );
  },

  create: (name: string, data: Record<string, unknown>) =>
    req<Record<string, unknown>>(
      `/${getTenantSlug()}/collections/${name}`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  getById: (name: string, id: string) =>
    req<Record<string, unknown>>(`/${getTenantSlug()}/collections/${name}/${id}`),

  update: (name: string, id: string, data: Record<string, unknown>) =>
    req<Record<string, unknown>>(
      `/${getTenantSlug()}/collections/${name}/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),

  patch: (name: string, id: string, data: Record<string, unknown>) =>
    req<Record<string, unknown>>(
      `/${getTenantSlug()}/collections/${name}/${id}`,
      { method: "PATCH", body: JSON.stringify(data) }
    ),

  delete: (name: string, id: string) =>
    req<void>(`/${getTenantSlug()}/collections/${name}/${id}`, { method: "DELETE" }),

  bulk: (name: string, operation: "insert" | "delete", records: Record<string, unknown>[]) =>
    req<{ affected: number; records: Record<string, unknown>[] }>(
      `/${getTenantSlug()}/collections/${name}/bulk`,
      { method: "POST", body: JSON.stringify({ operation, records }) }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// API KEYS
// POST /:slug/api-keys  body: { name, permissions?, expiresAt?, rateLimitPerMin? }
//   → data: { id, name, key_prefix, created_at, key, warning }
// GET  /:slug/api-keys  → data: ApiKey[]
// DELETE /:slug/api-keys/:keyId → 204
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_min: number;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export const apiKeys = {
  create: (name: string, permissions?: string[], expiresAt?: string, rateLimitPerMin = 100) =>
    req<ApiKey & { key: string; warning: string }>(
      `/${getTenantSlug()}/api-keys`,
      { method: "POST", body: JSON.stringify({ name, permissions, expiresAt: expiresAt || null, rateLimitPerMin }) }
    ),

  list: () => req<ApiKey[]>(`/${getTenantSlug()}/api-keys`),

  delete: (keyId: string) =>
    req<void>(`/${getTenantSlug()}/api-keys/${keyId}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOKS
// POST /:slug/webhooks  body: { name, url, events[], headers? }
//   → data: { id, name, url, events, enabled, created_at, secret, warning }
// GET  /:slug/webhooks  → data: Webhook[]
// PATCH/:slug/webhooks/:id body: { enabled } → data: { id, name, enabled }
// DELETE /:slug/webhooks/:id → 204
// ─────────────────────────────────────────────────────────────────────────────
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  failure_count: number;
  last_triggered: string | null;
  created_at: string;
}

export const webhooks = {
  create: (name: string, url: string, events: string[], headers?: Record<string, string>) =>
    req<Webhook & { secret: string; warning: string }>(
      `/${getTenantSlug()}/webhooks`,
      { method: "POST", body: JSON.stringify({ name, url, events, headers }) }
    ),

  list: () => req<Webhook[]>(`/${getTenantSlug()}/webhooks`),

  toggle: (webhookId: string, enabled: boolean) =>
    req<{ id: string; name: string; enabled: boolean }>(
      `/${getTenantSlug()}/webhooks/${webhookId}`,
      { method: "PATCH", body: JSON.stringify({ enabled }) }
    ),

  delete: (webhookId: string) =>
    req<void>(`/${getTenantSlug()}/webhooks/${webhookId}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// EDGE FUNCTIONS
// POST /:slug/functions  body: { name, slug, sourceCode, memoryMb?, timeoutMs?, envVars?, triggerType? }
//   → data: { id, name, slug, version, trigger_type, created_at }
// GET  /:slug/functions  → data: EdgeFunction[]
// GET  /:slug/functions/:slug → data: EdgeFunction & { source_code }
// DELETE /:slug/functions/:slug → 204
// POST /:slug/functions/:slug/invoke body: any → data: any
// ─────────────────────────────────────────────────────────────────────────────
export interface EdgeFunction {
  id: string;
  name: string;
  slug: string;
  version: number;
  trigger_type: string;
  created_at: string;
}

export const edgeFunctions = {
  create: (name: string, slug: string, sourceCode: string, opts?: { memoryMb?: number; timeoutMs?: number; envVars?: Record<string, string>; triggerType?: string }) =>
    req<EdgeFunction>(
      `/${getTenantSlug()}/functions`,
      { method: "POST", body: JSON.stringify({ name, slug, sourceCode, ...opts }) }
    ),

  list: () => req<EdgeFunction[]>(`/${getTenantSlug()}/functions`),

  get: (slug: string) =>
    req<EdgeFunction & { source_code: string }>(`/${getTenantSlug()}/functions/${slug}`),

  delete: (slug: string) =>
    req<void>(`/${getTenantSlug()}/functions/${slug}`, { method: "DELETE" }),

  invoke: (slug: string, payload?: unknown) =>
    req<unknown>(
      `/${getTenantSlug()}/functions/${slug}/invoke`,
      { method: "POST", body: JSON.stringify(payload ?? {}) }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// POST /:slug/notifications/send
//   body: { to, channel, template?, subject?, body?, variables?, priority? }
//   → data: { queued, logIds[], recipients } (202)
// POST /:slug/notifications/templates
//   body: { name, channel, subject?, bodyHtml?, bodyText?, variables? }
//   → data: { id, name, channel, version }
// GET  /:slug/notifications/templates → data: Template[]
// GET  /:slug/notifications/logs?page&limit → paginated NotificationLog[]
// ─────────────────────────────────────────────────────────────────────────────
export interface NotifTemplate {
  id: string;
  name: string;
  channel: string;
  subject: string;
  variables: string[];
  version: number;
  created_at: string;
}

export interface NotifLog {
  id: string;
  channel: string;
  recipient: string;
  status: "pending" | "sent" | "delivered" | "failed";
  provider_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

export const notifications = {
  send: (params: { to: string | string[]; channel: string; template?: string; subject?: string; body?: string; variables?: Record<string, unknown>; priority?: string }) =>
    req<{ queued: boolean; logIds: string[]; recipients: number }>(
      `/${getTenantSlug()}/notifications/send`,
      { method: "POST", body: JSON.stringify(params) }
    ),

  createTemplate: (params: { name: string; channel: string; subject?: string; bodyHtml?: string; bodyText?: string; variables?: string[] }) =>
    req<{ id: string; name: string; channel: string; version: number }>(
      `/${getTenantSlug()}/notifications/templates`,
      { method: "POST", body: JSON.stringify(params) }
    ),

  listTemplates: () => req<NotifTemplate[]>(`/${getTenantSlug()}/notifications/templates`),

  logs: (page = 1, limit = 20) =>
    reqPaginated<NotifLog>(`/${getTenantSlug()}/notifications/logs?page=${page}&limit=${limit}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// GET /:slug/analytics/overview?period=1h|24h|7d|30d
//   → data: { period, stats: { total_requests, successful, client_errors, server_errors, avg_duration_ms, max_duration_ms }, errors[], timeline[] }
// GET /:slug/analytics/requests?page&limit&status&method&traceId
//   → paginated RequestLog[]
// ─────────────────────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  period: string;
  stats: {
    total_requests: number;
    successful: number;
    client_errors: number;
    server_errors: number;
    avg_duration_ms: number;
    max_duration_ms: number;
  };
  errors: { status_code: number; count: string }[];
  timeline: { hour: string; requests: string; avg_ms: string }[];
}

export interface RequestLog {
  id: string;
  trace_id: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  ip_address: string;
  created_at: string;
}

export const analytics = {
  overview: (period: "1h" | "24h" | "7d" | "30d" = "24h") =>
    req<AnalyticsOverview>(`/${getTenantSlug()}/analytics/overview?period=${period}`),

  requests: (page = 1, limit = 50, filters?: { status?: number; method?: string; traceId?: string }) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) q.set("status", String(filters.status));
    if (filters?.method) q.set("method", filters.method);
    if (filters?.traceId) q.set("traceId", filters.traceId);
    return reqPaginated<RequestLog>(`/${getTenantSlug()}/analytics/requests?${q.toString()}`);
  },
};
