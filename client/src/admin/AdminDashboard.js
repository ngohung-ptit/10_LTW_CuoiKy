import { useEffect, useMemo, useState } from "react";
import { days, money, dateLabel } from "../data";
import { api, getToken } from "../api";
import { Notice, PageHeading } from "../components";

export const AdminDashboard = () => {
  const [date, setDate] = useState("");
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;
    setServerAnalytics(null);
    setError("");
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    Promise.all([
      api.get(`/analytics/dashboard${query}`),
      api.get(`/analytics/by-movie${query}`),
      api.get("/analytics/by-date"),
    ])
      .then(([dashboard, byMovie, byDate]) => {
        if (active) {
          setServerAnalytics({ dashboard, byMovie, byDate });
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const grouped = serverAnalytics?.byMovie || [];

  const daily = useMemo(() => {
    const byDateMap = new Map((serverAnalytics?.byDate || []).map((item) => [item.date, item.total]));
    return days.map((day) => ({ date: day, total: byDateMap.get(day) || 0 }));
  }, [serverAnalytics]);

  const stats = serverAnalytics?.dashboard;
  if (!stats) return <Notice error={Boolean(error)}>{error || "Đang tải thống kê..."}</Notice>;

  const maxDaily = Math.max(1, ...daily.map((d) => d.total));

  return (
    <>
      <PageHeading title="Tổng quan rạp phim">
        Doanh thu từ các vé đã xác nhận (MongoDB Aggregation Pipeline).
      </PageHeading>
      <div className="filter-row">
        <label>
          Ngày chiếu
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">Tất cả ngày</option>
            {days.map((day) => (
              <option value={day} key={day}>
                {dateLabel(day)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="stat-grid">
        <div>
          <span>Doanh thu</span>
          <strong>{money(stats.totalRevenue)}</strong>
        </div>
        <div>
          <span>Vé đã xác nhận</span>
          <strong>{stats.confirmedCount}</strong>
        </div>
        <div>
          <span>Ghế đã đặt</span>
          <strong>{stats.totalSeats}</strong>
        </div>
        <div>
          <span>Suất chiếu sắp tới</span>
          <strong>{stats.upcomingShowsCount}</strong>
        </div>
      </div>
      <div className="admin-revenue">
        <div>
          <h2>Doanh thu theo phim</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Ghế</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((item) => (
                  <tr key={item.movieId || item.title}>
                    <td>{item.title}</td>
                    <td>{item.seats}</td>
                    <td>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2>Doanh thu theo ngày</h2>
          <div className="revenue-bars">
            {daily.map((item) => (
              <div className="revenue-bar" key={item.date}>
                <span>{dateLabel(item.date)}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(0, (item.total / maxDaily) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{money(item.total)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
