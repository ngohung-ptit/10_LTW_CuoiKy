import { posterSrc } from "../posters";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Ticket, Check, QrCode } from "lucide-react";
import { useApp } from "../context";
import { dateLabel, money, showDate } from "../data";
import { Arrow, Breadcrumb, EmptyState, Notice, PageHeading } from "../components";

export const TicketsPage = () => {
  const { tickets, movies, user, cancelTicket } = useApp();
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState("");
  const [viewingQr, setViewingQr] = useState(null);
  const location = useLocation();
  const mine = tickets.filter(
    (t) => t.userId === user.id && (filter === "all" || t.status === filter),
  );
  return (
    <div className="wrap page-shell">
      <Breadcrumb current="Vé của tôi" />
      <PageHeading eyebrow="Những cuộc hẹn với điện ảnh" title="Vé của tôi">
        Thông tin suất chiếu và những chỗ ngồi bạn đã đặt.
      </PageHeading>
      {location.state?.booked && (
        <Notice>
          Đặt vé thành công. Vé đã được xác nhận, hẹn gặp bạn ở rạp!
        </Notice>
      )}
      <Notice>{message}</Notice>
      <div className="film-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tất cả vé
        </button>
        <button
          className={filter === "confirmed" ? "active" : ""}
          onClick={() => setFilter("confirmed")}
        >
          Đã xác nhận
        </button>
        <button
          className={filter === "cancelled" ? "active" : ""}
          onClick={() => setFilter("cancelled")}
        >
          Đã hủy
        </button>
      </div>
      <div className="ticket-list">
        {mine.map((ticket) => {
          const movie = movies.find((m) => m.id === ticket.movieId);
          const canCancel =
            ticket.status === "confirmed" &&
            showDate(ticket.show) - Date.now() >= 7200000;
          return (
            <article className="ticket-card" key={ticket.id}>
              <img
                src={posterSrc(movie?.poster || "interstellar.jpg")}
                alt={movie?.title || "Phim"}
                width="120"
                height="180"
              />
              <div className="ticket-content">
                <div className="ticket-card-top">
                  <span className={`status-label ${ticket.status}`}>
                    <Check size={14} />
                    {ticket.status === "confirmed" ? "Đã xác nhận" : "Đã hủy"}
                  </span>
                  <span className="ticket-id">{ticket.id}</span>
                </div>
                <h2>{movie?.title || "Phim đã ngừng chiếu"}</h2>
                <p>
                  {dateLabel(ticket.show.date)} · {ticket.show.time} ·{" "}
                  {ticket.roomName}
                </p>
                <p>
                  Ghế <strong>{ticket.seats.join(", ")}</strong> ·{" "}
                  {money(ticket.total)}
                </p>
                {canCancel &&
                  (confirmId === ticket.id ? (
                    <div className="cancel-confirm">
                      <span>Hủy vé và trả lại ghế?</span>
                      <button
                        className="text-button"
                        onClick={() => {
                          const success = cancelTicket(ticket.id);
                          setMessage(
                            success
                              ? "Vé đã được hủy. Ghế đã được trả lại."
                              : "Không thể hủy vé trong vòng 2 giờ trước suất chiếu.",
                          );
                          setConfirmId(null);
                        }}
                      >
                        Xác nhận hủy
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setConfirmId(null)}
                      >
                        Giữ lại vé
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-button cancel-button"
                      onClick={() => setConfirmId(ticket.id)}
                    >
                      Hủy vé
                    </button>
                  ))}
                {!canCancel && ticket.status === "confirmed" && (
                  <span className="muted">
                    Vé chỉ được hủy trước giờ chiếu ít nhất 2 giờ.
                  </span>
                )}
                {ticket.status === "confirmed" && (
                  <div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setViewingQr({ ...ticket, movie })}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <QrCode size={14} /> Xem mã QR vào rạp
                    </button>
                  </div>
                )}
              </div>
              <div className="ticket-stub">
                {ticket.status === "confirmed" ? (
                  <button
                    type="button"
                    onClick={() => setViewingQr({ ...ticket, movie })}
                    title="Bấm để phóng to mã QR"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <img
                      src={
                        ticket.qrCode ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(ticket.id)}`
                      }
                      alt={`Mã QR ${ticket.id}`}
                      width="90"
                      height="90"
                      style={{
                        background: "#fff",
                        padding: "4px",
                        border: "1px solid #d3cbbb",
                        borderRadius: "4px",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--action)" }}>
                      Phóng to QR
                    </span>
                  </button>
                ) : (
                  <>
                    <Ticket size={32} strokeWidth={1} />
                    <span className="muted">Vé đã hủy</span>
                  </>
                )}
                <span>{ticket.seats.length} ghế · {ticket.show.time}</span>
              </div>
            </article>
          );
        })}
        {!mine.length && (
          <EmptyState
            title="Chưa có vé trong mục này"
            action={
              <Link to="/lich-chieu" className="btn btn--primary">
                Chọn một suất phim <Arrow />
              </Link>
            }
          >
            Một bộ phim hay đang chờ bạn ở rạp.
          </EmptyState>
        )}
      </div>

      {viewingQr && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setViewingQr(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
              Vé điện tử UDU cinematic
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
              Đưa mã QR này cho nhân viên soát vé tại rạp
            </p>
            <div
              style={{
                display: "inline-block",
                padding: "12px",
                background: "#fbfaf5",
                border: "1px solid var(--line)",
                borderRadius: "6px",
              }}
            >
              <img
                src={
                  viewingQr.qrCode ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(viewingQr.id)}`
                }
                alt={`Mã QR ${viewingQr.id}`}
                width="180"
                height="180"
                style={{ display: "block" }}
              />
            </div>
            <div style={{ marginTop: "16px", fontSize: "14px", lineHeight: "1.6" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
                {viewingQr.movie?.title || "Phim chiếu rạp"}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
                {viewingQr.roomName} · {dateLabel(viewingQr.show.date)} · {viewingQr.show.time}
              </div>
              <div style={{ marginTop: "6px" }}>
                Ghế: <strong>{viewingQr.seats.join(", ")}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                Mã vé: <strong>{viewingQr.id}</strong>
              </div>
            </div>
            <button
              className="btn btn--primary"
              style={{ marginTop: "20px", width: "100%" }}
              onClick={() => setViewingQr(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
