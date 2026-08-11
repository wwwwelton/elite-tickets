export type Role = "ORGANIZER" | "CUSTOMER" | "GATE";

type ErrorPayload = {
  error?: { code?: unknown; message?: unknown };
  detail?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiRequestOptions = Omit<
  RequestInit,
  "body" | "cache" | "headers" | "method"
> & {
  accessToken?: string;
  body?: unknown;
  cache?: RequestCache;
  headers?: HeadersInit;
  method?: string;
};

export type MutationOptions<TBody> = Omit<
  ApiRequestOptions,
  "body" | "cache" | "method"
> & {
  body?: TBody;
  idempotencyKey?: string;
  method?: "DELETE" | "PATCH" | "POST" | "PUT";
};

function apiUrl(path: string): URL {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new ApiError(
      0,
      "configuration_error",
      "NEXT_PUBLIC_API_BASE_URL is not configured",
    );
  }
  return new URL(path.replace(/^\/+/, ""), `${baseUrl.replace(/\/+$/, "")}/`);
}

function errorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item !== "object" || item === null || !("msg" in item)) return null;
        return typeof item.msg === "string" ? item.msg : null;
      })
      .filter((message): message is string => message !== null);
    if (messages.length > 0) return messages.join("; ");
  }
  return fallback;
}

async function responsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }
  return response.text().catch(() => undefined);
}

function normalizedError(response: Response, payload: unknown): ApiError {
  const body =
    typeof payload === "object" && payload !== null ? (payload as ErrorPayload) : {};
  const domainError = body.error;
  const code =
    domainError && typeof domainError.code === "string"
      ? domainError.code
      : `http_${response.status}`;
  const message =
    domainError && typeof domainError.message === "string"
      ? domainError.message
      : errorMessage(body.detail, response.statusText || "Request failed");
  return new ApiError(response.status, code, message, payload);
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.accessToken) headers.set("Authorization", `Bearer ${options.accessToken}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  const { accessToken: ignoredAccessToken, body, ...requestOptions } = options;
  void ignoredAccessToken;
  try {
    const response = await fetch(apiUrl(path), {
      ...requestOptions,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: "omit",
      headers,
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
    const payload = await responsePayload(response);
    if (!response.ok) throw normalizedError(response, payload);
    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "network_error", "Unable to reach the API", error);
  }
}

export function apiMutation<TResponse, TBody = undefined>(
  path: string,
  options: MutationOptions<TBody> = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }
  const { idempotencyKey: ignoredIdempotencyKey, ...requestOptions } = options;
  void ignoredIdempotencyKey;
  return apiRequest<TResponse>(path, {
    ...requestOptions,
    cache: "no-store",
    headers,
    method: options.method ?? "POST",
  });
}
