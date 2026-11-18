import { posterSrc, readJpegPoster } from "../posters";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { Arrow, Button, Field, Notice, PageHeading } from "../components";
import { EditorHeader } from "./EditorHeader";
import { api } from "../api";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AdminMovies = () => {
  const { movies, setMovies, shows } = useApp();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const uploadVersion = useRef(0);
  useEffect(() => () => { uploadVersion.current += 1; }, []);
  const openEditor = (movie) => {
    if (saving) return;
    uploadVersion.current += 1;
    setUploading(false);
    setEditing(movie);
    setError("");
  };
  const uploadPoster = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const version = ++uploadVersion.current;
    setUploading(true);
    setError("");
    try {
      const poster = await readJpegPoster(file);
      if (version === uploadVersion.current) {
        setEditing((current) => current && { ...current, poster });
      }
    } catch (error) {
      if (version === uploadVersion.current) {
        input.value = "";
        setError(error.message);
      }
    } finally {
      if (version === uploadVersion.current) setUploading(false);
    }
  };
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
  const save = async (e) => {
    e.preventDefault();
    if (uploading || saving) return;
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
    };
    setSaving(true);
    setError("");
    try {
      const saved = editing.id
        ? await api.put(`/movies/${encodeURIComponent(movie.id)}`, movie)
        : await api.post("/movies", movie);
      setMovies((current) => editing.id
        ? current.map((m) => m.id === saved.id ? saved : m)
        : [...current, saved]);
      setEditing(null);
    } catch (error) {
      setError(error.status ? error.message : "Không kết nối được backend. Hãy kiểm tra server rồi thử lưu lại.");
    } finally {
      setSaving(false);
    }
  };
  const deleteMovie = async (id) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/movies/${encodeURIComponent(id)}`);
      setMovies((current) => current.filter((movie) => movie.id !== id));
      setDeleting(null);
    } catch (error) {
      setError(error.status ? error.message : "Không kết nối được backend. Chưa xóa phim.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <div className="admin-heading">
        <PageHeading title="Quản lý phim">
          Thông tin phim và trạng thái hiển thị tại rạp.
        </PageHeading>
        <Button
          disabled={saving}
          onClick={() => {
            openEditor(empty);
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
            onClose={() => openEditor(null)}
          />
          <fieldset className="movie-editor-fields" disabled={saving}>
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
            <Field label="Tải áp phích JPG">
              <input
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={uploadPoster}
                aria-describedby="poster-upload-help"
              />
              <span id="poster-upload-help" className="poster-upload-help" role="status">
                {uploading ? "Đang xử lý ảnh…" : "Chọn ảnh JPG hoặc JPEG, tối đa 5 MB."}
              </span>
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
          <Button type="submit" disabled={uploading || saving}>
            {saving ? "Đang lưu…" : "Lưu phim"} <Arrow />
          </Button>
          </fieldset>
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
                      src={posterSrc(movie.poster)}
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
                        openEditor({ ...movie });
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
                          disabled={saving}
                          onClick={() => deleteMovie(movie.id)}
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
