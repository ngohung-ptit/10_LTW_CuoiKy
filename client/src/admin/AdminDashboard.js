import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context";
import { days, money, dateLabel, showDate } from "../data";
import { api, getToken } from "../api";
import { PageHeading } from "../components";

export const AdminDashboard = () => {
  const { movies, tickets, shows } = useApp();
  const [date, setDate] = useState("");
  const [serverAnalytics, setServerAnalytics] = useState(null);

  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;
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
      .catch(() => {
        if (active) setServerAnalytics(null);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const confirmed = useMemo(
    () =>
      tickets.filter(
        (t) => t.status === "confirmed" && (!date || t.show?.date === date)
      ),
    [tickets, date]
  );

  const localRevenue = confirmed.reduce((sum, t) => sum + t.total, 0);
  const localSeats = confirmed.reduce((sum, t) => sum + (t.seats?.length || 0), 0);
  const localUpcoming = shows.filter(
    (s) => showDate(s) > new Date() && (!date || s.date === date)
  ).length;

  const grouped = useMemo(() => {
    if (serverAnalytics?.byMovie) {
      return serverAnalytics.byMovie;
    }
    return movies.map((movie) => {
      const list = confirmed.filter((t) => t.movieId === movie.id);
      return {
        movieId: movie.id,
        title: movie.title,
        total: list.reduce((sum, t) => sum + t.total, 0),
        seats: list.reduce((sum, t) => sum + (t.seats?.length || 0), 0),
      };
    });
  }, [serverAnalytics, movies, confirmed]);

  const daily = useMemo(() => {
    if (serverAnalytics?.byDate) {
      const byDateMap = new Map(serverAnalytics.byDate.map((item) => [item.date, item.total]));
      return days.map((day) => ({
        date: day,
        total: byDateMap.get(day) || 0,
      }));
    }
    return days.map((day) => ({
      date: day,
      total: tickets
        .filter((t) => t.status === "confirmed" && t.show?.date === day)
        .reduce((sum, t) => sum + t.total, 0),
    }));
  }, [serverAnalytics, tickets]);

  const stats = serverAnalytics?.dashboard || {
    totalRevenue: localRevenue,
    confirmedCount: confirmed.length,
    totalSeats: localSeats,
    upcomingShowsCount: localUpcoming,
  };

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
