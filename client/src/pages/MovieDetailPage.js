import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Clock3, Play, MapPin } from "lucide-react";
import { useApp } from "../context";
import { days } from "../data";
import { Arrow, Breadcrumb, Button, DatePicker, Notice, Showtimes } from "../components";
import { NotFoundPage } from "./NotFoundPage";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const MovieDetailPage = () => {
  const { movieId } = useParams();
  const { movies } = useApp();
  const movie = movies.find((m) => m.id === movieId);
  const [date, setDate] = useState(days[0]);
  const [trailer, setTrailer] = useState(false);
  const { hash, state } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  if (!movie) return <NotFoundPage />;
  return (
    <div className="wrap page-shell">
      <Breadcrumb
        current={movie.title}
        parent={{ label: "Phim", to: "/phim" }}
      />
      {state?.expired && (
        <Notice error>
          Đã hết 5 phút giữ ghế. Vui lòng chọn lại suất chiếu.
        </Notice>
      )}
      <div className="movie-detail">
        <img
          className="detail-poster"
          src={`/assets/images/${movie.poster}`}
          alt={`Áp phích ${movie.title}`}
          width="500"
          height="750"
        />
        <div className="detail-copy">
          <p className="eyebrow">
            {movie.status === "showing"
              ? "Đang chiếu tại UDU cinematic"
              : "Sắp chiếu tại UDU cinematic"}
          </p>
          <h1>{movie.title}</h1>
          <p className="detail-subtitle">{movie.subtitle}</p>
          <div className="detail-facts">
            <span className="age-inline">{movie.age}</span>
            <span>
              <Clock3 size={16} />
              {movie.duration} phút
            </span>
            <span>{movie.year}</span>
            <span>2D · Phụ đề</span>
          </div>
          <p className="synopsis">{movie.description}</p>
          <dl className="movie-credits">
            <dt>Thể loại</dt>
            <dd>{movie.genre}</dd>
            <dt>Đạo diễn</dt>
            <dd>{movie.director}</dd>
            <dt>Diễn viên</dt>
            <dd>{movie.cast}</dd>
          </dl>
          <div className="btn-row">
            {movie.status === "showing" && (
              <a className="btn btn--primary" href="#suat-chieu">
                Chọn suất chiếu <Arrow />
              </a>
            )}
            {movie.trailer && <Button
              secondary
              onClick={() => setTrailer(!trailer)}
              aria-expanded={trailer}
            >
              <Play size={16} />
              {trailer ? "Đóng trailer" : "Xem trailer"}
            </Button>}
          </div>
        </div>
      </div>
      {trailer && movie.trailer && (
        <div className="trailer-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${movie.trailer}`}
            title={`Trailer ${movie.title}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <a
            className="link"
            href={`https://www.youtube.com/watch?v=${movie.trailer}`}
            target="_blank"
            rel="noreferrer"
          >
            Mở trailer trên YouTube <Arrow diagonal />
          </a>
        </div>
      )}
      <section className="detail-shows" id="suat-chieu">
        <div className="section-heading">
          <h2>Suất chiếu</h2>
          <span className="muted">
            <MapPin size={15} /> UDU cinematic
          </span>
        </div>
        {movie.status === "showing" ? (
          <>
            <DatePicker value={date} onChange={setDate} />
            <Showtimes movieId={movie.id} date={date} />
          </>
        ) : (
          <Notice>
            Lịch chiếu sẽ được mở sau. Bạn có thể xem các phim đang chiếu tại
            rạp.
          </Notice>
        )}
      </section>
    </div>
  );
};
