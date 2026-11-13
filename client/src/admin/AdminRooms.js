import { useState } from "react";
import { Plus, Armchair } from "lucide-react";
import { useApp } from "../context";
import { Arrow, Button, Field, Notice, PageHeading } from "../components";
import { EditorHeader } from "./EditorHeader";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const AdminRooms = () => {
  const { rooms, setRooms, shows } = useApp();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const save = (e) => {
    e.preventDefault();
    if (
      !editing.name.trim() ||
      +editing.rows < 1 ||
      +editing.rows > 12 ||
      +editing.columns < 4 ||
      +editing.columns > 16
    ) {
      setError("Nhập tên phòng, 1–12 hàng và 4–16 ghế mỗi hàng.");
      return;
    }
    const vipRows = editing.vipText
      .toUpperCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      vipRows.some(
        (s) =>
          s.length !== 1 ||
          s.charCodeAt(0) < 65 ||
          s.charCodeAt(0) >= 65 + +editing.rows,
      )
    ) {
      setError("Hàng VIP phải nằm trong sơ đồ, viết như D,E,F.");
      return;
    }
    if (
      rooms.some(
        (r) =>
          r.id !== editing.id &&
          r.name.toLowerCase() === editing.name.trim().toLowerCase(),
      )
    ) {
      setError("Tên phòng đã tồn tại.");
      return;
    }
    const room = {
      id: editing.id || crypto.randomUUID(),
      name: editing.name.trim(),
      rows: +editing.rows,
      columns: +editing.columns,
      vipRows: [...new Set(vipRows)],
    };
    setRooms((current) =>
      editing.id
        ? current.map((r) => (r.id === room.id ? room : r))
        : [...current, room],
    );
    setEditing(null);
    setError("");
  };
  return (
    <>
      <div className="admin-heading">
        <PageHeading title="Phòng chiếu">
          Sơ đồ ghế được tạo từ cấu hình của từng phòng.
        </PageHeading>
        <Button
          onClick={() =>
            setEditing({ name: "", rows: 8, columns: 10, vipText: "D,E,F" })
          }
        >
          <Plus size={18} />
          Thêm phòng
        </Button>
      </div>
      <Notice error>{error}</Notice>
      {editing && (
        <form className="admin-editor" onSubmit={save}>
          <EditorHeader
            title="Cấu hình phòng chiếu"
            onClose={() => setEditing(null)}
          />
          <div className="form-grid">
            <Field label="Tên phòng">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Số hàng (1–12)">
              <input
                type="number"
                min="1"
                max="12"
                value={editing.rows}
                onChange={(e) =>
                  setEditing({ ...editing, rows: e.target.value })
                }
              />
            </Field>
            <Field label="Ghế mỗi hàng (4–16)">
              <input
                type="number"
                min="4"
                max="16"
                value={editing.columns}
                onChange={(e) =>
                  setEditing({ ...editing, columns: e.target.value })
                }
              />
            </Field>
            <Field label="Hàng VIP (cách nhau bằng dấu phẩy)">
              <input
                value={editing.vipText}
                onChange={(e) =>
                  setEditing({ ...editing, vipText: e.target.value })
                }
              />
            </Field>
          </div>
          <Button type="submit">
            Lưu phòng <Arrow />
          </Button>
        </form>
      )}
      <div className="room-grid">
        {rooms.map((room) => (
          <article className="room-card" key={room.id}>
            <Armchair size={28} strokeWidth={1} />
            <h2>{room.name}</h2>
            <div className="mini-seat-map" aria-hidden="true">
              {Array.from({ length: room.rows }, (_, i) => (
                <div key={i}>
                  {Array.from({ length: room.columns }, (_, j) => (
                    <i
                      className={
                        room.vipRows.includes(String.fromCharCode(65 + i))
                          ? "mini-vip"
                          : ""
                      }
                      key={j}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p>
              {room.rows} hàng × {room.columns} ghế · {room.rows * room.columns}{" "}
              chỗ
            </p>
            <p className="muted">
              Hàng VIP: {room.vipRows.join(", ") || "Không có"}
            </p>
            <div className="table-actions">
              <button
                className="text-button"
                onClick={() => {
                  if (shows.some((s) => s.roomId === room.id)) {
                    setError(
                      "Phòng đang có suất chiếu. Xóa các suất trước khi thay đổi cấu hình để giữ đúng sơ đồ ghế.",
                    );
                    return;
                  }
                  setEditing({ ...room, vipText: room.vipRows.join(",") });
                  setError("");
                }}
              >
                Sửa phòng
              </button>
              <button
                className="text-button"
                onClick={() => {
                  if (shows.some((s) => s.roomId === room.id))
                    setError("Không thể xóa phòng đang có suất chiếu.");
                  else
                    setRooms((current) =>
                      current.filter((r) => r.id !== room.id),
                    );
                }}
              >
                Xóa phòng
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
