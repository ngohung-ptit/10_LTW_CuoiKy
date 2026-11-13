// Mô phỏng tài khoản cho frontend, không gọi API và không thay thế bảo mật backend.
const ACCOUNTS_KEY = "udu-accounts";
const SESSION_KEY = "udu-session";

// Hai tài khoản mẫu; mật khẩu được ghi trong README.
const demoAccounts = [
  {
    id: "udu-admin", name: "Quản trị UDU", email: "admin@udu.example", role: "admin",
    salt: "udu-demo-admin",
    passwordHash: "988d6270c149fe7c8ceb8066f63d23577b27fd2e82dc1ea8af139aa46cc9f0bb",
  },
  {
    id: "udu-member", name: "Bạn yêu phim", email: "member@udu.example", role: "member",
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

// Lưu giá trị băm thay vì mật khẩu rõ. PBKDF2 là API có sẵn của trình duyệt.
const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    key, 256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

// Context chỉ cần thông tin hiển thị và vai trò, không cần giá trị băm mật khẩu.
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
const startSession = (account) => {
  sessionStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
};

export const registerAccount = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  // Đọc lại sau await để thấy tài khoản vừa được thêm ở tab khác.
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("Email này đã được đăng ký.");
  }
  const account = {
    id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail,
    role: "member", salt, passwordHash,
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  return startSession(account);
};

export const loginAccount = async ({ email, password }) => {
  const account = readAccounts().find((item) => item.email === email.trim().toLowerCase());
  if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }
  return startSession(account);
};

export const getCurrentUser = () => {
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = readAccounts().find((item) => item.id === id);
  return account ? publicUser(account) : null;
};

export const logoutAccount = () => sessionStorage.removeItem(SESSION_KEY);
