import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, X, Ticket, MapPin, Clock3, Search, ChevronRight, LogOut } from "lucide-react";
import { useApp } from "./context";
import { dateLabel, days, showDate } from "./data";

export const Arrow = ({ diagonal = false }) =>
  diagonal ? (
    <ArrowUpRight size={18} aria-hidden="true" />
  ) : (
    <ArrowRight size={18} aria-hidden="true" />
  );
export const Brand = () => (
  <Link className="brand" to="/" aria-label="UDU cinematic, trang chủ">
    UDU
    <span className="brand-name">
      cinematic<span className="brand-dot">.</span>
    </span>
  </Link>
);
export const Button = ({
  children,
  secondary,
  className = "",
  ...props
}) => {
  const classes = `btn btn--${secondary ? "secondary" : "primary"} ${className}`;
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
export const Header = () => {
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="skip-link" href="#main">
          Đến nội dung chính
        </a>
        <Brand />
        <nav
          className={`nav-links ${open ? "is-open" : ""}`}
          aria-label="Điều hướng chính"
          onClick={(event) => { if (event.target.closest("a")) setOpen(false); }}
        >
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <NavLink to="/phim">Phim</NavLink>
          <NavLink to="/lich-chieu">Lịch chiếu</NavLink>
          {user && <NavLink to="/ve-cua-toi">Vé của tôi</NavLink>}
          {user?.role === "admin" && <NavLink to="/quan-tri">Quản trị</NavLink>}
          {user ? <button className="mobile-account text-button" onClick={() => { logout(); setOpen(false); }}>Đăng xuất</button> : <NavLink className="mobile-account" to="/dang-nhap">Đăng nhập</NavLink>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link className="user-name" to="/ve-cua-toi">
                {user.name.split(" ").slice(-1)}
              </Link>
              <button
                className="icon-button signout"
                title="Đăng xuất"
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link className="login-link" to="/dang-nhap">
              Đăng nhập
            </Link>
          )}
          <Link to="/lich-chieu" className="btn btn--primary nav-book">
            <Ticket size={17} /> Đặt vé
          </Link>
          <button
            className="icon-button menu-button"
            aria-expanded={open}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
};
export const Footer = () => (
  <footer className="site-footer">
    <div className="wrap">
      <div className="footer-top">
        <div>
          <Brand />
          <p>Chọn một bộ phim. Dành một buổi tối.</p>
        </div>
        <div className="footer-links">
          <Link className="link" to="/phim">
            Phim tại rạp
          </Link>
          <Link className="link" to="/lich-chieu">
            Lịch chiếu
          </Link>
          <Link className="link" to="/huong-dan">
            Hướng dẫn đặt vé
          </Link>
        </div>
      </div>
    </div>
  </footer>
);
export const Layout = () => (
  <>
    <Header />
    <main id="main" tabIndex="-1">
      <Outlet />
    </main>
    <Footer />
  </>
);
export const Protected = ({ admin = false }) => {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/dang-nhap" state={{ from: location.pathname }} replace />;
  }
  if (admin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
export const Breadcrumb = ({ current, parent }) => (
  <nav className="breadcrumb" aria-label="Đường dẫn">
    <Link to="/">Trang chủ</Link>
    <ChevronRight size={14} />
    {parent && (
      <>
        <Link to={parent.to}>{parent.label}</Link>
        <ChevronRight size={14} />
      </>
    )}
    <span aria-current="page">{current}</span>
  </nav>
);
export const PageHeading = ({ eyebrow, title, children }) => (
  <div className="page-heading">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>
    {children && <p className="page-intro">{children}</p>}
  </div>
);
export const MovieCard = ({ movie }) => (
  <article className="movie-card card">
    <Link
      className="poster-link m-zoom"
      to={`/phim/${movie.id}`}
      aria-label={`Xem phim ${movie.title}`}
    >
      <img
        src={`/assets/images/${movie.poster}`}
        srcSet={`/assets/images/${movie.poster.replace('.jpg', '-small.jpg')} 342w, /assets/images/${movie.poster} 500w`}
        sizes="(max-width: 639px) calc((100vw - 56px) / 2), (max-width: 1023px) calc((100vw - 88px) / 2), 302px"
        alt={`Áp phích ${movie.title}`}
        width="500"
        height="750"
        loading="lazy"
      />
      <span className="age-badge">{movie.age}</span>
      <span className="poster-action">
        Xem phim <Arrow diagonal />
      </span>
    </Link>
    <div className="movie-card-body">
      <div className="movie-meta">
        <span>{movie.genre}</span>
        <span>{movie.duration} phút</span>
      </div>
      <h3>
        <Link to={`/phim/${movie.id}`}>{movie.title}</Link>
      </h3>
      <p>{movie.subtitle}</p>
      <Link className="movie-book link" to={`/phim/${movie.id}#suat-chieu`}>
        {movie.status === "showing" ? "Chọn suất chiếu" : "Xem chi tiết"}
        <Arrow />
      </Link>
    </div>
  </article>
);
export const EmptyState = ({ title, children, action }) => (
  <div className="empty-state">
    <Ticket size={36} strokeWidth={1} />
    <h2>{title}</h2>
    <p>{children}</p>
    {action}
  </div>
);
export const SearchField = ({ value, onChange }) => {
  const inputRef = useRef(null);
  return (
    <div className="search-field">
      <Search size={18} />
      <input
        ref={inputRef}
        aria-label="Tìm phim theo tên"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm tên phim bạn muốn xem..."
      />
      {value && (
        <button
          className="icon-button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Xóa tìm kiếm"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
export const DatePicker = ({ value, onChange }) => (
  <div className="date-picker" aria-label="Chọn ngày chiếu">
    {days.map((day, i) => (
      <button
        key={day}
        className={`date-button ${value === day ? "selected" : ""}`}
        onClick={() => onChange(day)}
        aria-pressed={value === day}
      >
        <span>
          {i === 0
            ? "Hôm nay"
            : new Intl.DateTimeFormat("vi-VN", {
                weekday: "short",
                timeZone: "Asia/Ho_Chi_Minh",
              }).format(new Date(`${day}T12:00:00+07:00`))}
        </span>
        <strong>{dateLabel(day)}</strong>
      </button>
    ))}
  </div>
);
export const ShowtimeButton = ({ show }) => (
  <Link className="showtime" to={`/dat-ve/${show.id}`}>
    <strong>{show.time}</strong>
    <span>2D · Phụ đề</span>
  </Link>
);
export const Showtimes = ({ movieId, date }) => {
  const { shows, rooms } = useApp();
  const filtered = shows.filter(
    (s) => s.movieId === movieId && s.date === date && showDate(s) > new Date(),
  );
  return filtered.length ? (
    <div className="showtime-groups">
      {rooms.map((room) => {
        const list = filtered.filter((s) => s.roomId === room.id);
        return (
          !!list.length && (
            <div className="showtime-group" key={room.id}>
              <span className="room-label">
                <MapPin size={15} />
                {room.name}
              </span>
              <div className="showtime-list">
                {list.map((show) => (
                  <ShowtimeButton key={show.id} show={show} />
                ))}
              </div>
            </div>
          )
        );
      })}
    </div>
  ) : (
    <p className="muted no-shows">
      Không còn suất chiếu trong ngày này. Bạn hãy chọn ngày khác.
    </p>
  );
};
export const Steps = ({ active }) => (
  <ol className="booking-steps">
    {["Chọn suất", "Chọn ghế", "Xác nhận vé"].map((label, i) => (
      <li key={label} className={i <= active ? "is-active" : ""}>
        <span>{String(i + 1).padStart(2, "0")}</span>
        {label}
      </li>
    ))}
  </ol>
);
export const Field = ({ label, error, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {error && (
      <span className="field-error" role="alert">
        {error}
      </span>
    )}
  </label>
);
export const Notice = ({ children, error }) =>
  children ? (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
export const Timer = ({ value }) => (
  <div className="hold-timer">
    <Clock3 size={18} />
    <span>Thời gian giữ ghế</span>
    <strong>{value}</strong>
  </div>
);
