import { posterSrc } from "./posters";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { Check, Info, Tag } from "lucide-react";
import { useApp, useOccupied } from "./context";
import { useCountdown } from "./hooks";
import { money, dateLabel, showDate, parseVipRows } from "./data";
import { api, getToken, SOCKET_BASE } from "./api";
import { clearBooking, removeSeats, startBooking, toggleSeat } from "./store";
import { Arrow, Breadcrumb, Button, Notice, Steps, Timer } from "./components";
import { NotFoundPage } from "./pages/NotFoundPage";

export const SeatMap = ({ room, occupied, selected, onSelect }) => {
  const vipRows = useMemo(() => parseVipRows(room?.vipRows), [room?.vipRows]);
  return (
    <div className="seat-map" style={{ "--seat-columns": room.columns }}>
      <div className="screen">
        <span>Màn hình</span>
      </div>
      <div className="seat-rows">
        {Array.from({ length: room.rows }, (_, row) => {
          const letter = String.fromCharCode(65 + row);
          const vip = vipRows.includes(letter);
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
};

export const BookingSummary = ({
  movie,
  show,
  room,
  selected,
  rawTotal,
  discount,
  total,
  appliedCoupon,
  onApplyCoupon,
  onClearCoupon,
  review,
  submitting,
  onContinue,
  onBack,
}) => {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const handleApply = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setCheckingCoupon(true);
    setCouponError("");
    try {
      await onApplyCoupon(code);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  return (
    <aside className="booking-summary">
      <div className="summary-movie">
        <img
          src={posterSrc(movie.poster)}
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
      {selected.length > 0 && (
        <div className="coupon-box">
          <label className="coupon-label" htmlFor="coupon-input">
            <Tag size={14} /> Mã giảm giá
          </label>
          {appliedCoupon ? (
            <div className="coupon-applied">
              <span>
                <strong>{appliedCoupon.code}</strong> (-{money(discount)})
              </span>
              <button type="button" className="text-button" onClick={onClearCoupon}>
                Gỡ
              </button>
            </div>
          ) : (
            <div className="coupon-row">
              <input
                id="coupon-input"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="UDU10 hoặc VIP20"
              />
              <button
                type="button"
                className="btn btn--secondary coupon-btn"
                onClick={handleApply}
                disabled={checkingCoupon}
              >
                {checkingCoupon ? "..." : "Áp dụng"}
              </button>
            </div>
          )}
          {couponError && (
            <span className="field-error" role="alert">
              {couponError}
            </span>
          )}
        </div>
      )}
      <div className="summary-total">
        <span>
          Tổng cộng <small>{selected.length} ghế{discount > 0 ? ` · Đã giảm ${money(discount)} (gốc ${money(rawTotal)})` : ""}</small>
        </span>
        <strong>{money(total)}</strong>
      </div>
      <Button onClick={onContinue} disabled={!selected.length || submitting}>
        {submitting ? "Đang xác nhận…" : review ? "Xác nhận đặt vé" : "Tiếp tục"}
        <Arrow />
      </Button>
      {review && (
        <button className="text-button" onClick={onBack} disabled={submitting}>
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
};

export const BookingSession = ({ show, movie, room }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { book, notify, syncShowSold, mergeShowSold, releaseShowSold } = useApp();
  const { selected, deadline } = useSelector((s) => s.booking);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const occupied = useOccupied(show);
  const vipList = useMemo(() => parseVipRows(room?.vipRows), [room?.vipRows]);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const expire = useCallback(() => {
    dispatch(clearBooking());
    notify("Đã hết 5 phút giữ ghế. Vui lòng chọn lại suất chiếu.");
    navigate(`/phim/${movie.id}`, { replace: true, state: { expired: true } });
  }, [dispatch, movie.id, navigate, notify]);
  const timer = useCountdown(deadline, expire);

  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;

    const handleTakenSeats = (seats) => {
      const takenSelected = selectedRef.current.filter((seatId) => seats.includes(seatId));
      if (takenSelected.length) {
        dispatch(removeSeats(takenSelected));
        setReview(false);
        setError(`Ghế ${takenSelected.join(", ")} vừa được đặt bởi người khác.`);
      }
    };

    const socket = io(SOCKET_BASE, { transports: ["websocket", "polling"] });
    const onSeatsBooked = (payload) => {
      if (!active || payload?.showId !== show.id || !Array.isArray(payload.seats)) return;
      mergeShowSold(show.id, payload.seats);
      handleTakenSeats(payload.seats);
    };
    const onSeatsReleased = (payload) => {
      if (!active || payload?.showId !== show.id || !Array.isArray(payload.seats)) return;
      releaseShowSold(show.id, payload.seats);
    };

    socket.on("seatsBooked", onSeatsBooked);
    socket.on("seatsReleased", onSeatsReleased);

    const pollShow = async () => {
      try {
        const fresh = await api.get(`/shows/${encodeURIComponent(show.id)}`);
        if (!active || !Array.isArray(fresh?.sold)) return;
        syncShowSold(show.id, fresh.sold);
        handleTakenSeats(fresh.sold);
      } catch {
        // Ignore transient polling failures
      }
    };
    const interval = setInterval(pollShow, 5000);

    return () => {
      active = false;
      clearInterval(interval);
      socket.off("seatsBooked", onSeatsBooked);
      socket.off("seatsReleased", onSeatsReleased);
      socket.disconnect();
    };
  }, [show.id, dispatch, syncShowSold, mergeShowSold, releaseShowSold]);

  const rawTotal = useMemo(() => {
    let totalPrice = 0;
    for (const seatId of selected) {
      totalPrice += vipList.includes(seatId[0]) ? show.vipPrice : show.price;
    }
    return totalPrice;
  }, [selected, vipList, show.vipPrice, show.price]);

  const discount = useMemo(() => {
    if (!appliedCoupon || rawTotal <= 0) return 0;
    return Math.min(
      Math.round((rawTotal * appliedCoupon.discountPercent) / 100),
      appliedCoupon.maxDiscount
    );
  }, [appliedCoupon, rawTotal]);

  const total = Math.max(0, rawTotal - discount);

  const applyCoupon = async (code) => {
    const verified = await api.post("/coupons/verify", { code });
    setAppliedCoupon(verified);
  };

  const select = (id) => {
    if (selected.length >= 8 && !selected.includes(id)) {
      setError("Bạn chỉ có thể chọn tối đa 8 ghế cho mỗi lần đặt.");
      return;
    }
    setError("");
    dispatch(toggleSeat(id));
  };

  const finishBooking = (result) => {
    if (result.conflicts) {
      setError(
        `Ghế ${result.conflicts.join(", ")} vừa được đặt. Vui lòng chọn ghế khác.`
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

  const confirm = async () => {
    if (!selected.length || submitting) return;
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

    const couponCode = appliedCoupon?.code || null;
    setSubmitting(true);
    setError("");
    try {
      const result = await book(show, selected, couponCode);
      finishBooking(result);
    } catch (err) {
      setError(err.message || "Không thể đặt vé. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
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
                {[...selected].sort().map((id) => {
                  const isVip = vipList.includes(id[0]);
                  return (
                    <div key={id}>
                      <span>{isVip ? "Ghế VIP" : "Ghế thường"}</span>
                      <strong>{id}</strong>
                      <span>{money(isVip ? show.vipPrice : show.price)}</span>
                    </div>
                  );
                })}
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
          rawTotal={rawTotal}
          discount={discount}
          total={total}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={applyCoupon}
          onClearCoupon={() => setAppliedCoupon(null)}
          review={review}
          submitting={submitting}
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
