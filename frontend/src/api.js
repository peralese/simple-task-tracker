const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const TOKEN_KEY = "task_app_jwt";

function authHeaders(includeJson = true) {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(path, { method = "GET", body, includeJson = true } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(includeJson),
    body: body === undefined ? undefined : includeJson ? JSON.stringify(body) : body
  });

  const payload = await response.json().catch(() => ({
    success: false,
    data: null,
    error: "Invalid response"
  }));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || "Request failed");
  }

  return payload.data;
}

export const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const api = {
  login(passphrase) {
    return request("/auth/login", {
      method: "POST",
      body: { passphrase }
    });
  },
  getTasks(filters = {}) {
    const query = new URLSearchParams();
    if (filters.priority) query.set("priority", filters.priority);
    if (filters.category) query.set("category", filters.category);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/tasks${suffix}`);
  },
  createTask(task) {
    return request("/tasks", {
      method: "POST",
      body: task
    });
  },
  updateTask(id, task) {
    return request(`/tasks/${id}`, {
      method: "PUT",
      body: task
    });
  },
  deleteTask(id) {
    return request(`/tasks/${id}`, {
      method: "DELETE"
    });
  },
  getArchive(page = 1, pageSize = 20, status = "") {
    const query = new URLSearchParams({ page, pageSize });
    if (status) query.set("status", status);
    return request(`/archive?${query.toString()}`);
  },
  getConfig() {
    return request("/config");
  },
  updateConfig(values) {
    return request("/config", {
      method: "PUT",
      body: values
    });
  },
  subscribePush(subscription) {
    return request("/push/subscribe", {
      method: "POST",
      body: subscription
    });
  },
  testPush() {
    return request("/push/test", {
      method: "POST"
    });
  }
};

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
