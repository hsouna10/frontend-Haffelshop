export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type ApiCategory = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
};

export type ApiProduct = {
  _id: string;
  slug?: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  imagePublicId?: string;
  productType?: "clothing" | "shoes" | "accessory";
  productSubtype?: string;
  brand?: string;
  isActive?: boolean;
  createdAt?: string;
  category: ApiCategory | string;
  colors?: {
    _id: string;
    name: string;
    hex: string;
    images: { url: string; publicId?: string }[];
  }[];
  variants?: {
    _id: string;
    color: string;
    size?: string;
    sku?: string;
    stock: number;
    priceOverride?: number;
  }[];
};

export type ApiOrder = {
  _id: string;
  orderNumber?: string;
  email?: string;
  user: { name: string; email?: string } | string | null;
  items: {
    product: Pick<ApiProduct, "_id" | "name" | "sku"> | string | null;
    quantity: number;
    price: number;
    name?: string;
    color?: string;
    size?: string;
    image?: string;
    sku?: string;
  }[];
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paidAt?: string;
  statusHistory?: { status: string; changedAt: string; changedBy?: { name?: string } | string }[];
  paymentHistory?: { status: string; changedAt: string }[];
  financialMovements?: { reference: string; type: "payment" | "refund"; description: string; amount: number; createdAt: string }[];
  shippingAddress?: string;
  phone?: string;
  createdAt: string;
};

export type ApiPaginated<T> = {
  orders?: T[];
  transactions?: ApiTransaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export type ApiSalesStats = {
  revenue: number;
  refunds: number;
  sales: number;
  orders: number;
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  todaySales: number;
  averageBasket: number;
  daily: { _id: string; revenue: number; sales: number }[];
};

export type ApiBalance = {
  balance: number;
  received: number;
  refunded: number;
  pendingEstimated: number;
  pendingOrders: number;
  updatedAt: string;
};

export type ApiTransaction = {
  order: string;
  orderNumber?: string;
  type: "payment" | "refund";
  description: string;
  amount: number;
  balanceAfter?: number;
  createdAt: string;
  customerName?: string;
};

export type ApiAdminUser = AuthUser & {
  _id: string;
};

const apiBase = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const authStorageKey = "haffeli-auth";

export function getAuthSession(): AuthSession | null {
  const saved = localStorage.getItem(authStorageKey);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as AuthSession;
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(authStorageKey, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(authStorageKey);
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: object | FormData; token?: string; headers?: HeadersInit } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const session = getAuthSession();
  const token = options.token ?? session?.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${apiBase}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : `La requête a échoué (${response.status}).`;
    const issues = payload && Array.isArray(payload.issues)
      ? payload.issues.flatMap((issue: unknown) => {
        if (!issue || typeof issue !== "object") return [];
        const detail = issue as { path?: unknown; message?: unknown };
        if (typeof detail.message !== "string") return [];
        const path = Array.isArray(detail.path)
          ? detail.path.filter((part): part is string | number => typeof part === "string" || typeof part === "number").join(".")
          : "";
        return [`${path ? `${path}: ` : ""}${detail.message}`];
      })
      : [];
    throw new Error(issues.length ? `${message} — ${issues.join("; ")}` : message);
  }

  return payload as T;
}
