import { NavLink, Outlet } from "react-router-dom";
import { Film, CalendarDays, Armchair, ChartNoAxesCombined } from "lucide-react";

export const AdminLayout = () => (
  <div className="wrap page-shell admin-shell">
    <div className="admin-top">
      <p className="eyebrow">UDU cinematic / Quản trị</p>
    </div>
    <nav className="admin-nav" aria-label="Quản trị">
      <NavLink to="/quan-tri" end>
        <ChartNoAxesCombined size={18} />
        Tổng quan
      </NavLink>
      <NavLink to="/quan-tri/phim">
        <Film size={18} />
        Phim
      </NavLink>
      <NavLink to="/quan-tri/phong">
        <Armchair size={18} />
        Phòng chiếu
      </NavLink>
      <NavLink to="/quan-tri/suat-chieu">
        <CalendarDays size={18} />
        Suất chiếu
      </NavLink>
    </nav>
    <Outlet />
  </div>
);

// Các trang còn lại nằm trong từng file riêng để dễ tìm.
