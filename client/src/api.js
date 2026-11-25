const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, "");

export const getToken = () => sessionStorage.getItem("udu-token");

const request = async (method, endpoint, body) => {
  const token = getToken();
  const headers = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Lỗi khi gọi API.");
    error.status = res.status;
    error.details = data;
    error.conflicts = data.conflicts;
    throw error;
  }
  return data;
};

export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, body) => request("POST", endpoint, body),
  put: (endpoint, body) => request("PUT", endpoint, body),
  patch: (endpoint, body) => request("PATCH", endpoint, body),
  delete: (endpoint) => request("DELETE", endpoint),
};
