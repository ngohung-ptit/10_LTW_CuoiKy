import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { Arrow, Button, Field, Notice, PageHeading } from "../components";
import { EditorHeader } from "./EditorHeader";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AdminMovies = () => {
  const { movies, setMovies, shows } = useApp();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const empty = {
    title: "",
    subtitle: "",
    genre: "Hành động",
    duration: 100,
    year: new Date().getFullYear(),
    age: "P",
    director: "",
    cast: "",
    poster: "interstellar.jpg",
    trailer: "",
    description: "",
    status: "showing",
  };
  const save = (e) => {
    e.preventDefault();
    if (
      !editing.title.trim() ||
      !editing.director.trim() ||
      !editing.description.trim() ||
      +editing.duration < 1 ||
      +editing.duration > 360
    ) {
      setError(
        "Nhập tên phim, đạo diễn, nội dung và thời lượng từ 1–360 phút.",
      );
      return;
    }
    if (editing.trailer && !/^[\w-]{11}$/.test(editing.trailer)) {
      setError("Mã video YouTube phải có 11 ký tự.");
      return;
    }
    const movie = {
      ...editing,
      title: editing.title.trim(),
      duration: +editing.duration,
      id: editing.id || crypto.randomUUID(),
    };
    setMovies((current) =>
      editing.id
        ? current.map((m) => (m.id === movie.id ? movie : m))
        : [...current, movie],
    );
    setEditing(null);
    setError("");
  };
  return (
    <>
      <div className="admin-heading">
        <PageHeading title="Quản lý phim">
          Thông tin phim và trạng thái hiển thị tại rạp.
        </PageHeading>
        <Button
          onClick={() => {
            setEditing(empty);
            setError("");
          }}
        >
          <Plus size={18} />
          Thêm phim
        </Button>
      </div>
      <Notice error>{error}</Notice>
      {editing && (
        <form className="admin-editor" onSubmit={save}>
          <EditorHeader
            title={editing.id ? "Sửa phim" : "Thêm phim"}
            onClose={() => setEditing(null)}
          />
          <div className="form-grid">
            {[
              ["title", "Tên phim"],
              ["subtitle", "Tên tiếng Việt"],
              ["director", "Đạo diễn"],
              ["cast", "Diễn viên"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  value={editing[key]}
                  onChange={(e) =>
                    setEditing({ ...editing, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Thời lượng (phút)">
              <input
                type="number"
                min="1"
                max="360"
                value={editing.duration}
                onChange={(e) =>
                  setEditing({ ...editing, duration: e.target.value })
                }
              />
            </Field>
            <Field label="Thể loại">
              <select
                value={editing.genre}
                onChange={(e) =>
                  setEditing({ ...editing, genre: e.target.value })
                }
              >
                {[
                  "Hành động",
                  "Hoạt hình",
                  "Khoa học viễn tưởng",
                  "Tình cảm",
                  "Tâm lý",
                  "Kinh dị",
                ].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Phân loại độ tuổi">
              <select
                value={editing.age}
                onChange={(e) =>
                  setEditing({ ...editing, age: e.target.value })
                }
              >
                {["P", "T13", "T16", "T18"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option value="showing">Đang chiếu</option>
                <option value="upcoming">Sắp chiếu</option>
              </select>
            </Field>
            <Field label="Áp phích có sẵn">
              <select
                value={editing.poster}
                onChange={(e) =>
                  setEditing({ ...editing, poster: e.target.value })
                }
              >
                {[
                  "interstellar.jpg",
                  "dune.jpg",
                  "soul.jpg",
                  "spirited.jpg",
                  "inception.jpg",
                  "your-name.jpg",
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Mã video YouTube">
              <input
                value={editing.trailer}
                onChange={(e) =>
                  setEditing({ ...editing, trailer: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Nội dung phim">
            <textarea
              rows="3"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </Field>
          <Button type="submit">
            Lưu phim <Arrow />
          </Button>
        </form>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <div className="table-movie">
                    <img
                      src={`/assets/images/${movie.poster}`}
                      alt=""
                      width="36"
                      height="54"
                    />
                    <strong>{movie.title}</strong>
                  </div>
                </td>
                <td>{movie.genre}</td>
                <td>{movie.duration} phút</td>
                <td>
                  {movie.status === "showing" ? "Đang chiếu" : "Sắp chiếu"}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      aria-label={`Sửa ${movie.title}`}
                      onClick={() => {
                        setEditing({ ...movie });
                        setError("");
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Xóa ${movie.title}`}
                      onClick={() => {
                        if (shows.some((s) => s.movieId === movie.id))
                          setError(
                            "Phim đang có suất chiếu. Hãy xóa các suất chiếu trước.",
                          );
                        else setDeleting(movie.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    {deleting === movie.id && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => {
                            setMovies((current) =>
                              current.filter((m) => m.id !== movie.id),
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
    </>
  );
};
