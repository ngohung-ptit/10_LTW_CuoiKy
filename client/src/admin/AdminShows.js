import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { days, money, showDate } from "../data";
import { Arrow, Button, EmptyState, Field, Notice, PageHeading } from "../components";
import { EditorHeader } from "./EditorHeader";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AdminShows = () => {
  const { shows, setShows, movies, rooms, tickets } = useApp();
  const [date, setDate] = useState(days[0]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const locked = (id) =>
    shows.find((s) => s.id === id)?.sold.length ||
    tickets.some((t) => t.showId === id && t.status === "confirmed");
  const save = (e) => {
    e.preventDefault();
    const movie = movies.find((m) => m.id === editing.movieId);
    if (
      !movie ||
      !editing.date ||
      !editing.time ||
      !rooms.some((r) => r.id === editing.roomId) ||
      Number(editing.price) <= 0 ||
      Number(editing.vipPrice) < Number(editing.price) ||
      showDate(editing) <= new Date()
    ) {
      setError(
        "Kiểm tra phim, phòng, thời gian trong tương lai và giá VIP không thấp hơn giá thường.",
      );
      return;
    }
    const start = showDate(editing).getTime();
    const end = start + movie.duration * 60000;
    // Hai khoảng giờ bị trùng khi suất mới bắt đầu trước lúc suất cũ kết thúc
    // và kết thúc sau lúc suất cũ bắt đầu. Chỉ so sánh trong cùng một phòng.
    const overlap = shows.some((s) => {
      const duration = movies.find((m) => m.id === s.movieId)?.duration || 120;
      const otherStart = showDate(s).getTime();
      return (
        s.id !== editing.id &&
        s.roomId === editing.roomId &&
        start < otherStart + duration * 60000 &&
        end > otherStart
      );
    });
    if (overlap) {
      setError("Suất chiếu bị chồng giờ với một suất khác trong cùng phòng.");
      return;
    }
    const show = {
      ...editing,
      id: editing.id || crypto.randomUUID(),
      price: +editing.price,
      vipPrice: +editing.vipPrice,
      sold: editing.sold || [],
    };
    setShows((current) =>
      editing.id
        ? current.map((s) => (s.id === show.id ? show : s))
        : [...current, show],
    );
    setDate(show.date);
    setEditing(null);
    setError("");
  };
  const filtered = shows
    .filter((s) => s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <div className="admin-heading">
        <PageHeading title="Suất chiếu">
          Sắp xếp phim và thời gian chiếu cho từng phòng.
        </PageHeading>
        <Button
          onClick={() => {
            setEditing({
              movieId: movies[0]?.id || "",
              roomId: rooms[0]?.id || "",
              date,
              time: "19:00",
              price: 75000,
              vipPrice: 95000,
              sold: [],
            });
            setError("");
          }}
        >
          <Plus size={18} />
          Thêm suất chiếu
        </Button>
      </div>
      <Notice error>{error}</Notice>
      {editing && (
        <form className="admin-editor" onSubmit={save}>
          <EditorHeader
            title={editing.id ? "Sửa suất chiếu" : "Thêm suất chiếu"}
            onClose={() => setEditing(null)}
          />
          <div className="form-grid">
            <Field label="Phim">
              <select
                value={editing.movieId}
                onChange={(e) =>
                  setEditing({ ...editing, movieId: e.target.value })
                }
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phòng">
              <select
                value={editing.roomId}
                onChange={(e) =>
                  setEditing({ ...editing, roomId: e.target.value })
                }
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ngày chiếu">
              <input
                type="date"
                min={days[0]}
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </Field>
            <Field label="Giờ chiếu">
              <input
                type="time"
                value={editing.time}
                onChange={(e) =>
                  setEditing({ ...editing, time: e.target.value })
                }
              />
            </Field>
            <Field label="Giá thường (đồng)">
              <input
                type="number"
                min="1"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: e.target.value })
                }
              />
            </Field>
            <Field label="Giá VIP (đồng)">
              <input
                type="number"
                min="1"
                value={editing.vipPrice}
                onChange={(e) =>
                  setEditing({ ...editing, vipPrice: e.target.value })
                }
              />
            </Field>
          </div>
          <Button type="submit">
            Lưu suất chiếu <Arrow />
          </Button>
        </form>
      )}
      <div className="filter-row">
        <label>
          Ngày chiếu
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <span className="muted">{filtered.length} suất chiếu</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Giờ chiếu</th>
              <th>Phim</th>
              <th>Phòng</th>
              <th>Thường / VIP</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((show) => (
              <tr key={show.id}>
                <td>
                  <strong>{show.time}</strong>
                </td>
                <td>{movies.find((m) => m.id === show.movieId)?.title}</td>
                <td>{rooms.find((r) => r.id === show.roomId)?.name}</td>
                <td>
                  {money(show.price)} / {money(show.vipPrice)}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      aria-label={`Sửa suất ${show.time}`}
                      onClick={() => {
                        if (locked(show.id))
                          setError(
                            "Suất đã bán ghế, không thể thay đổi thông tin.",
                          );
                        else {
                          setEditing({ ...show });
                          setError("");
                        }
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Xóa suất ${show.time}`}
                      onClick={() => {
                        if (locked(show.id))
                          setError("Suất đã bán ghế, không thể xóa.");
                        else setDeleting(show.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    {deleting === show.id && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => {
                            setShows((current) =>
                              current.filter((s) => s.id !== show.id),
                            );
                            setDeleting(null);
                          }}
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          className="text-button"
                          onClick={() => setDeleting(null)}
                        >
                          Giữ lại
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <EmptyState title="Chưa có suất chiếu">
          Thêm suất đầu tiên cho ngày này.
        </EmptyState>
      )}
    </>
  );
};
