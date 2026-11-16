const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getToken = () => sessionStorage.getItem("udu-token");

export const api = {
  async get(endpoint) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || "Lỗi khi gọi API.");
      error.status = res.status;
      error.details = data;
      throw error;
    }
    return data;
  },

  async post(endpoint, body) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
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
  },

  async patch(endpoint, body) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || "Lỗi khi gọi API.");
      error.status = res.status;
      error.details = data;
      throw error;
    }
    return data;
  },
};

