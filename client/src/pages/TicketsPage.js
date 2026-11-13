import { Link } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Ticket, Check } from "lucide-react";
import { useApp } from "../context";
import { dateLabel, money, showDate } from "../data";
import { Arrow, Breadcrumb, EmptyState, Notice, PageHeading } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const TicketsPage = () => {
  const { tickets, movies, user, cancelTicket } = useApp();
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState("");
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
                src={`/assets/images/${movie?.poster || "interstellar.jpg"}`}
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
              </div>
              <div className="ticket-stub">
                <Ticket size={32} strokeWidth={1} />
                <span>{ticket.seats.length} ghế</span>
                <strong>{ticket.show.time}</strong>
                <span>UDU cinematic</span>
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
    </div>
  );
};
