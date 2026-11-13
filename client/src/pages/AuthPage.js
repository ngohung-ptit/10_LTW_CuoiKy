import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";
import { useApp } from "../context";
import { Arrow, Button, Field, Notice } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AuthPage = () => {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { authenticate } = useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (register && name.trim().length < 2)
      next.name = "Tên cần có ít nhất 2 ký tự.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Nhập địa chỉ email hợp lệ.";
    if (password.length < 8) next.password = "Mật khẩu cần ít nhất 8 ký tự.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const user = await authenticate(register ? "register" : "login", { name, email, password });
      let destination = location.state?.from || "/ve-cua-toi";
      if (user.role === "admin") destination = "/quan-tri";
      // Thành viên không bị đưa trở lại trang admin sau khi đăng ký.
      if (user.role !== "admin" && destination.startsWith("/quan-tri")) destination = "/ve-cua-toi";
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors({ general: error.message });
    } finally { setLoading(false); }
  };
  return (
    <div className="wrap page-shell auth-layout">
      <div className="auth-visual">
        <img
          src="/assets/images/cinema.jpg"
          alt="Hàng ghế trong rạp chiếu phim"
          width="1200"
          height="800"
        />
        <div>
          <Ticket size={30} strokeWidth={1} />
          <h2>
            Cuộc hẹn tiếp theo,
            <br />ở hàng ghế bạn thích.
          </h2>
          <p>Lưu vé, xem lịch sử và sẵn sàng cho buổi phim.</p>
        </div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">Thành viên UDU cinematic</p>
        <h1>{register ? "Tạo tài khoản" : "Hẹn gặp lại ở rạp."}</h1>
        <p className="muted">
          {register
            ? "Thêm một người bạn cùng yêu điện ảnh."
            : "Đăng nhập để đặt vé và quản lý buổi phim của bạn."}
        </p>
        <form onSubmit={submit} noValidate>
          {register && (
            <Field label="Họ và tên" error={errors.name}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Mật khẩu" error={errors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </Field>
          <Notice error>{errors.general}</Notice>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : register ? "Tạo tài khoản" : "Đăng nhập"}
            <Arrow />
          </Button>
        </form>
        <p className="auth-switch">
          {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setErrors({});
            }}
          >
            {register ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
      </div>
    </div>
  );
};
