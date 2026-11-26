import { api } from "./api";

const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });

const authenticate = async (endpoint, fields) => {
  try {
    const result = await api.post(endpoint, fields);
    const user = publicUser(result.user);
    sessionStorage.setItem("udu-token", result.token);
    sessionStorage.setItem("udu-api-user", JSON.stringify(user));
    return user;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
  }
};

export const registerAccount = ({ name, email, password }) =>
  authenticate("/auth/register", { name, email, password });

export const loginAccount = ({ email, password }) =>
  authenticate("/auth/login", { email, password });

export const getCurrentUser = () => {
  if (!sessionStorage.getItem("udu-token")) return null;
  try {
    return JSON.parse(sessionStorage.getItem("udu-api-user")) || null;
  } catch {
    return null;
  }
};

export const logoutAccount = () => {
  sessionStorage.removeItem("udu-token");
  sessionStorage.removeItem("udu-api-user");
};
