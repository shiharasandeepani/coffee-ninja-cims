const API_URL = "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  data: any;

  constructor(status: number, data: any) {
    super(data?.error?.message || "Something went wrong.");
    this.status = status;
    this.code = data?.error?.code || "UNKNOWN";
    this.fields = data?.error?.fields;
    this.data = data;
  }
}

export async function api(path: string, options: { method?: string; body?: any } = {}) {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: options.method || "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: { code: "NETWORK", message: "Cannot reach the server. Please try again." } });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}