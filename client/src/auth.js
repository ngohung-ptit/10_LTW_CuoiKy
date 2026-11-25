import { api } from "./api";

const ACCOUNTS_KEY = "udu-accounts";
const SESSION_KEY = "udu-session";
const isTestEnv = () => process.env.NODE_ENV === "test";

const demoAccounts = [
  {
    id: "udu-admin",
    name: "Quản trị UDU",
    email: "admin@udu.example",
    role: "admin",
    salt: "udu-demo-admin",
    passwordHash: "988d6270c149fe7c8ceb8066f63d23577b27fd2e82dc1ea8af139aa46cc9f0bb",
  },
  {
    id: "udu-member",
    name: "Bạn yêu phim",
    email: "member@udu.example",
    role: "member",
    salt: "udu-demo-member",
    passwordHash: "7ffb8c47afde62e706552522d4d666053da1e31bece65e05a57be25bfd0fb450",
  },
];

const readAccounts = () => {
  const saved = localStorage.getItem(ACCOUNTS_KEY);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(demoAccounts));
  return demoAccounts;
};

const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};

const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });

const startSession = (account) => {
  sessionStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
};

const startApiSession = (result) => {
  sessionStorage.setItem("udu-token", result.token);
  sessionStorage.setItem("udu-api-user", JSON.stringify(publicUser(result.user)));
  sessionStorage.removeItem(SESSION_KEY);
  return publicUser(result.user);
};

export const registerAccount = async ({ name, email, password }) => {
  try {
    const res = await api.post("/auth/register", { name, email, password });
    return startApiSession(res);
  } catch (err) {
    if (err.status) {
      throw new Error(err.message);
    }
    if (!isTestEnv()) {
      throw new Error("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const accounts = readAccounts();
    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("Email này đã được đăng ký.");
    }
    const emailPrefix = normalizedEmail
      .split("@")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const baseId = emailPrefix ? `udu-${emailPrefix}` : "udu-user";
    const existingAccountIds = new Set(accounts.map((account) => account.id));
    let accountId = baseId;
    let counter = 2;
    while (existingAccountIds.has(accountId)) {
      accountId = `${baseId}-${counter}`;
      counter++;
    }
    const account = {
      id: accountId,
      name: name.trim(),
      email: normalizedEmail,
      role: "member",
      salt,
      passwordHash,
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    return startSession(account);
  }
};

export const loginAccount = async ({ email, password }) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    return startApiSession(res);
  } catch (err) {
    if (err.status) {
      throw new Error(err.message);
    }
    if (!isTestEnv()) {
      throw new Error("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
    }

    const account = readAccounts().find(
      (item) => item.email === email.trim().toLowerCase()
    );
    if (!account || (await hashPassword(password, account.salt)) !== account.passwordHash) {
      throw new Error("Email hoặc mật khẩu không đúng.");
    }
    return startSession(account);
  }
};

export const getCurrentUser = () => {
  if (sessionStorage.getItem("udu-token")) {
    try {
      return JSON.parse(sessionStorage.getItem("udu-api-user")) || null;
    } catch {
      return null;
    }
  }
  if (!isTestEnv()) return null;
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = readAccounts().find((item) => item.id === id);
  return account ? publicUser(account) : null;
};

export const logoutAccount = () => {
  sessionStorage.removeItem("udu-token");
  sessionStorage.removeItem("udu-api-user");
  sessionStorage.removeItem(SESSION_KEY);
};
