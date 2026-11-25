import { posterSrc } from "../posters";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Ticket, Check, QrCode } from "lucide-react";
import { useApp } from "../context";
import { dateLabel, money, showDate } from "../data";
import { Arrow, Breadcrumb, EmptyState, Notice, PageHeading } from "../components";

export const TicketsPage = () => {
  const { tickets, movies, user, cancelTicket } = useApp();
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewingQr, setViewingQr] = useState(null);
  const location = useLocation();
  const mine = tickets.filter(
    (t) => t.userId === user.id && (filter === "all" || t.status === filter)
  );

  const handleConfirmCancel = async (ticketId) => {
    setErrorMessage("");
    try {
      const outcome = cancelTicket(ticketId);
      const success =
        outcome && typeof outcome.then === "function" ? await outcome : outcome;
      setMessage(
        success
          ? "Vé đã được hủy. Ghế đã được trả lại."
          : "Không thể hủy vé trong vòng 2 giờ trước suất chiếu."
      );
    } catch (err) {
      setErrorMessage(err.message || "Không thể hủy vé. Vui lòng thử lại.");
    } finally {
      setConfirmId(null);
    }
  };

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
      <Notice error>{errorMessage}</Notice>
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
            ticket.show &&
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
                {ticket.show && (
                  <p>
                    {dateLabel(ticket.show.date)} · {ticket.show.time} ·{" "}
                    {ticket.roomName}
                  </p>
                )}
                <p>
                  Ghế <strong>{(ticket.seats || []).join(", ")}</strong> ·{" "}
                  {money(ticket.total)}
                  {ticket.couponCode ? ` (Mã ${ticket.couponCode})` : ""}
                </p>
                {canCancel &&
                  (confirmId === ticket.id ? (
                    <div className="cancel-confirm">
                      <span>Hủy vé và trả lại ghế?</span>
                      <button
                        className="text-button"
                        onClick={() => handleConfirmCancel(ticket.id)}
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
                      className="text-button qr-btn-inline"
                      onClick={() => setViewingQr({ ...ticket, movie })}
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
                    className="qr-thumb-btn"
                  >
                    <img
                      src={
                        ticket.qrCode ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(ticket.id)}`
                      }
                      alt={`Mã QR ${ticket.id}`}
                      width="90"
                      height="90"
                      className="qr-thumb-img"
                    />
                    <span className="qr-thumb-hint">Phóng to QR</span>
                  </button>
                ) : (
                  <>
                    <Ticket size={32} strokeWidth={1} />
                    <span className="muted">Vé đã hủy</span>
                  </>
                )}
                <span>
                  {(ticket.seats || []).length} ghế
                  {ticket.show ? ` · ${ticket.show.time}` : ""}
                </span>
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
          className="qr-modal-backdrop"
          onClick={() => setViewingQr(null)}
        >
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Vé điện tử UDU cinematic</h3>
            <p className="qr-modal-subtitle">
              Đưa mã QR này cho nhân viên soát vé tại rạp
            </p>
            <div className="qr-modal-box">
              <img
                src={
                  viewingQr.qrCode ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(viewingQr.id)}`
                }
                alt={`Mã QR ${viewingQr.id}`}
                width="180"
                height="180"
              />
            </div>
            <div className="qr-modal-meta">
              <strong>{viewingQr.movie?.title || "Phim chiếu rạp"}</strong>
              {viewingQr.show && (
                <p>
                  {viewingQr.roomName} · {dateLabel(viewingQr.show.date)} ·{" "}
                  {viewingQr.show.time}
                </p>
              )}
              <p>
                Ghế: <strong>{(viewingQr.seats || []).join(", ")}</strong>
              </p>
              <small>Mã vé: {viewingQr.id}</small>
            </div>
            <button
              className="btn btn--primary qr-modal-close"
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
