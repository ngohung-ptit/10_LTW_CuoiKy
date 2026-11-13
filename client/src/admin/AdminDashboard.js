import { useMemo, useState } from "react";
import { useApp } from "../context";
import { days, money, dateLabel, showDate } from "../data";
import { PageHeading } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AdminDashboard = () => {
  const { movies, tickets, shows } = useApp();
  const [date, setDate] = useState("");
  const confirmed = useMemo(
    () =>
      tickets.filter(
        (t) => t.status === "confirmed" && (!date || t.show.date === date),
      ),
    [tickets, date],
  );
  const revenue = confirmed.reduce((sum, t) => sum + t.total, 0);
  const grouped = useMemo(
    () =>
      movies.map((movie) => {
        const list = confirmed.filter((t) => t.movieId === movie.id);
        return {
          title: movie.title,
          total: list.reduce((sum, t) => sum + t.total, 0),
          seats: list.reduce((sum, t) => sum + t.seats.length, 0),
        };
      }),
    [movies, confirmed],
  );
  const daily = days.map((day) => ({
    date: day,
    total: tickets
      .filter((t) => t.status === "confirmed" && t.show.date === day)
      .reduce((sum, t) => sum + t.total, 0),
  }));
  return (
    <>
      <PageHeading title="Tổng quan rạp phim">
        Doanh thu từ các vé đã xác nhận.
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
          <strong>{money(revenue)}</strong>
        </div>
        <div>
          <span>Vé đã xác nhận</span>
          <strong>{confirmed.length}</strong>
        </div>
        <div>
          <span>Ghế đã đặt</span>
          <strong>
            {confirmed.reduce((sum, t) => sum + t.seats.length, 0)}
          </strong>
        </div>
        <div>
          <span>Suất chiếu sắp tới</span>
          <strong>
            {
              shows.filter(
                (s) => showDate(s) > new Date() && (!date || s.date === date),
              ).length
            }
          </strong>
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
                  <tr key={item.title}>
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
                      width: `${Math.max(0, (item.total / Math.max(1, ...daily.map((d) => d.total))) * 100)}%`,
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
