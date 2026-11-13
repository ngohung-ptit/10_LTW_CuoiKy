import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context";
import { days, normalise } from "../data";
import { Breadcrumb, DatePicker, EmptyState, PageHeading, SearchField, Showtimes } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const SchedulePage = () => {
  const { movies } = useApp();
  const [date, setDate] = useState(days[0]);
  const [query, setQuery] = useState("");
  const filtered = movies.filter(
    (m) =>
      m.status === "showing" &&
      normalise(`${m.title} ${m.subtitle}`).includes(normalise(query)),
  );
  return (
    <div className="wrap page-shell">
      <Breadcrumb current="Lịch chiếu" />
      <PageHeading eyebrow="Lên lịch cho buổi phim" title="Lịch chiếu tại rạp">
        Chọn ngày, chọn phim. Một chỗ ngồi đang chờ bạn.
      </PageHeading>
      <div className="schedule-tools">
        <DatePicker value={date} onChange={setDate} />
        <SearchField value={query} onChange={setQuery} />
      </div>
      <div className="schedule-list">
        {filtered.map((movie) => (
          <article className="schedule-row" key={movie.id}>
            <Link className="schedule-poster m-zoom" to={`/phim/${movie.id}`}>
              <img
                src={`/assets/images/${movie.poster}`}
                alt={`Áp phích ${movie.title}`}
                width="100"
                height="150"
              />
            </Link>
            <div className="schedule-movie">
              <span className="age-inline">{movie.age}</span>
              <h2>
                <Link to={`/phim/${movie.id}`}>{movie.title}</Link>
              </h2>
              <p>
                {movie.genre} · {movie.duration} phút
              </p>
              <span className="muted">2D · Phụ đề tiếng Việt</span>
            </div>
            <Showtimes movieId={movie.id} date={date} />
          </article>
        ))}
        {!filtered.length && (
          <EmptyState title="Không tìm thấy phim">
            Thử tìm một tên phim khác.
          </EmptyState>
        )}
      </div>
    </div>
  );
};
