import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Info } from "lucide-react";
import { useApp, useOccupied } from "./context";
import { useCountdown } from "./hooks";
import { money, dateLabel, showDate } from "./data";
import { clearBooking, removeSeats, startBooking, toggleSeat } from "./store";
import { Arrow, Breadcrumb, Button, Notice, Steps, Timer } from "./components";
import { NotFoundPage } from "./pages/NotFoundPage";

export const SeatMap = ({ room, occupied, selected, onSelect }) => (
  <div className="seat-map" style={{ "--seat-columns": room.columns }}>
    <div className="screen">
      <span>Màn hình</span>
    </div>
    <div className="seat-rows">
      {Array.from({ length: room.rows }, (_, row) => {
        const letter = String.fromCharCode(65 + row);
        const vip = room.vipRows.includes(letter);
        return (
          <div className="seat-row" key={letter}>
            <span className="row-letter">{letter}</span>
            <div
              className="seat-row-buttons"
              style={{ "--columns": room.columns }}
            >
              {Array.from({ length: room.columns }, (_, column) => {
                const id = `${letter}${column + 1}`;
                const sold = occupied.includes(id);
                const chosen = selected.includes(id);
                let status = "thường";
                if (vip) status = "VIP";
                if (chosen) status = "đang chọn";
                if (sold) status = "đã bán";
                return (
                  <button
                    key={id}
                    disabled={sold}
                    aria-label={`Ghế ${id}, ${status}`}
                    aria-pressed={chosen}
                    className={`seat ${vip ? "vip" : ""} ${sold ? "sold" : ""} ${chosen ? "chosen" : ""}`}
                    onClick={() => onSelect(id)}
                  >
                    {chosen ? <Check size={14} /> : column + 1}
                  </button>
                );
              })}
            </div>
            <span className="row-letter">{letter}</span>
          </div>
        );
      })}
    </div>
    <div className="seat-legend">
      <span>
        <i className="seat" />
        Ghế thường
      </span>
      <span>
        <i className="seat vip" />
        Ghế VIP
      </span>
      <span>
        <i className="seat chosen" />
        Đang chọn
      </span>
      <span>
        <i className="seat sold" />
        Đã bán
      </span>
    </div>
  </div>
);

export const BookingSummary = ({
  movie,
  show,
  room,
  selected,
  total,
  review,
  onContinue,
  onBack,
}) => (
  <aside className="booking-summary">
    <div className="summary-movie">
      <img
        src={`/assets/images/${movie.poster}`}
        alt={`Áp phích ${movie.title}`}
        width="80"
        height="120"
      />
      <div>
        <span className="age-inline">{movie.age}</span>
        <h2>{movie.title}</h2>
        <p>2D · Phụ đề tiếng Việt</p>
      </div>
    </div>
    <dl className="summary-details">
      <dt>Rạp chiếu</dt>
      <dd>UDU cinematic</dd>
      <dt>Ngày chiếu</dt>
      <dd>{dateLabel(show.date)}</dd>
      <dt>Suất chiếu</dt>
      <dd>
        {show.time} · {room.name}
      </dd>
      <dt>Ghế đã chọn</dt>
      <dd>
        {selected.length ? [...selected].sort().join(", ") : "Chưa chọn ghế"}
      </dd>
    </dl>
    <div className="summary-total">
      <span>
        Tổng cộng <small>{selected.length} ghế</small>
      </span>
      <strong>{money(total)}</strong>
    </div>
    <Button onClick={onContinue} disabled={!selected.length}>
      {review ? "Xác nhận đặt vé" : "Tiếp tục"}
      <Arrow />
    </Button>
    {review && (
      <button className="text-button" onClick={onBack}>
        Quay lại chọn ghế
      </button>
    )}
    <p className="summary-note">
      <Info size={15} />
      {review
        ? "Vé được xác nhận ngay sau khi đặt."
        : "Chọn tối đa 8 ghế trong một lần đặt."}
    </p>
  </aside>
);

export const BookingSession = ({ show, movie, room }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { book, notify } = useApp();
  const { selected, deadline } = useSelector((s) => s.booking);
  const occupied = useOccupied(show);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const expire = useCallback(() => {
    dispatch(clearBooking());
    notify("Đã hết 5 phút giữ ghế. Vui lòng chọn lại suất chiếu.");
    navigate(`/phim/${movie.id}`, { replace: true, state: { expired: true } });
  }, [dispatch, movie.id, navigate, notify]);
  const timer = useCountdown(deadline, expire);
  // Chỉ tính lại khi ghế đang chọn hoặc giá vé thay đổi (yêu cầu của đề).
  const total = useMemo(() => {
    let totalPrice = 0;
    for (const seatId of selected) {
      const row = seatId[0];
      if (room.vipRows.includes(row)) {
        totalPrice += show.vipPrice;
      } else {
        totalPrice += show.price;
      }
    }
    return totalPrice;
  }, [selected, room.vipRows, show.vipPrice, show.price]);
  const select = (id) => {
    if (selected.length >= 8 && !selected.includes(id)) {
      setError("Bạn chỉ có thể chọn tối đa 8 ghế cho mỗi lần đặt.");
      return;
    }
    setError("");
    dispatch(toggleSeat(id));
  };
  const confirm = () => {
    if (!selected.length) return;
    if (Date.now() >= deadline) {
      expire();
      return;
    }
    if (showDate(show) <= new Date()) {
      setError("Suất chiếu đã bắt đầu. Vui lòng chọn suất khác.");
      return;
    }
    if (!review) {
      setReview(true);
      return;
    }
    const result = book(show, selected, total);
    if (result.conflicts) {
      setError(
        `Ghế ${result.conflicts.join(", ")} vừa được đặt. Vui lòng chọn ghế khác.`,
      );
      dispatch(removeSeats(result.conflicts));
      setReview(false);
      return;
    }
    dispatch(clearBooking());
    navigate("/ve-cua-toi", {
      replace: true,
      state: { booked: result.ticket.id },
    });
  };
  return (
    <div className="wrap page-shell booking-page">
      <Breadcrumb
        current="Đặt vé"
        parent={{ to: `/phim/${movie.id}`, label: movie.title }}
      />
      <div className="booking-title">
        <div>
          <p className="eyebrow">Buổi phim của bạn</p>
          <h1>{review ? "Kiểm tra vé của bạn." : "Chọn một chỗ ngồi."}</h1>
        </div>
        <Timer value={timer} />
      </div>
      <Steps active={review ? 2 : 1} />
      <Notice error>{error}</Notice>
      <div className="booking-layout">
        <div className="seat-panel">
          {review ? (
            <div className="review-panel">
              <div className="review-check">
                <Check size={30} />
              </div>
              <h2>Mọi thứ đã sẵn sàng?</h2>
              <p>Kiểm tra thông tin bên cạnh trước khi xác nhận vé.</p>
              <div className="review-seats">
                {[...selected].sort().map((id) => (
                  <div key={id}>
                    <span>
                      {room.vipRows.includes(id[0]) ? "Ghế VIP" : "Ghế thường"}
                    </span>
                    <strong>{id}</strong>
                    <span>
                      {money(
                        room.vipRows.includes(id[0])
                          ? show.vipPrice
                          : show.price,
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="muted">
                Bạn có thể hủy vé trước giờ chiếu ít nhất 2 giờ.
              </p>
            </div>
          ) : (
            <>
              <div className="seat-panel-heading">
                <h2>{room.name}</h2>
                <span>{room.rows * room.columns} ghế · 2D</span>
              </div>
              <SeatMap
                room={room}
                occupied={occupied}
                selected={selected}
                onSelect={select}
              />
              <div className="seat-prices">
                <span>
                  Thường <strong>{money(show.price)}</strong>
                </span>
                <span>
                  VIP <strong>{money(show.vipPrice)}</strong>
                </span>
              </div>
            </>
          )}
        </div>
        <BookingSummary
          movie={movie}
          show={show}
          room={room}
          selected={selected}
          total={total}
          review={review}
          onContinue={confirm}
          onBack={() => setReview(false)}
        />
      </div>
    </div>
  );
};

export const BookingPage = () => {
  const { showId } = useParams();
  const { shows, movies, rooms } = useApp();
  const dispatch = useDispatch();
  const session = useSelector((s) => s.booking);
  const show = shows.find((s) => s.id === showId);
  const movie = movies.find((m) => m.id === show?.movieId);
  const room = rooms.find((r) => r.id === show?.roomId);
  useEffect(() => {
    if (show) dispatch(startBooking(showId));
  }, [show, showId, dispatch]);
  if (!show || !movie || !room) return <NotFoundPage />;
  if (showDate(show) <= new Date())
    return (
      <div className="wrap page-shell">
        <Notice error>Suất chiếu này đã bắt đầu.</Notice>
        <Link to={`/phim/${movie.id}`} className="btn btn--primary">
          Chọn suất chiếu khác <Arrow />
        </Link>
      </div>
    );
  if (session.showId !== showId || !session.deadline)
    return <div className="wrap page-shell">Đang chuẩn bị sơ đồ ghế...</div>;
  return <BookingSession key={showId} show={show} movie={movie} room={room} />;
};
