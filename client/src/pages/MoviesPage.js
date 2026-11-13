import { useMemo, useState } from "react";
import { useApp } from "../context";
import { dateLabel, days, normalise, showDate } from "../data";
import { useDebounce } from "../hooks";
import { Breadcrumb, EmptyState, MovieCard, PageHeading, SearchField } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const MoviesPage = () => {
  const { movies, shows } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("showing");
  const [genre, setGenre] = useState("all");
  const [date, setDate] = useState("");
  const debounced = useDebounce(query);
  const filtered = useMemo(
    () =>
      movies.filter(
        (m) =>
          m.status === status &&
          normalise(`${m.title} ${m.subtitle}`).includes(
            normalise(debounced),
          ) &&
          (genre === "all" || m.genre === genre) &&
          (!date ||
            shows.some(
              (s) =>
                s.movieId === m.id &&
                s.date === date &&
                showDate(s) > new Date(),
            )),
      ),
    [movies, shows, status, genre, date, debounced],
  );
  return (
    <div className="wrap page-shell">
      <Breadcrumb current="Phim" />
      <PageHeading
        eyebrow="Phim tại UDU cinematic"
        title="Một bộ phim cho mỗi cuộc hẹn."
      >
        Tìm bộ phim bạn muốn xem, rồi chọn một suất chiếu phù hợp.
      </PageHeading>
      <div className="catalog-toolbar">
        <div className="film-tabs">
          <button
            onClick={() => setStatus("showing")}
            className={status === "showing" ? "active" : ""}
          >
            Đang chiếu
          </button>
          <button
            onClick={() => {
              setStatus("upcoming");
              setDate("");
            }}
            className={status === "upcoming" ? "active" : ""}
          >
            Sắp chiếu
          </button>
        </div>
        <SearchField value={query} onChange={setQuery} />
      </div>
      <div className="filter-row">
        <label>
          Thể loại
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="all">Tất cả thể loại</option>
            {[...new Set(movies.map((m) => m.genre))].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>
          Ngày chiếu
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={status === "upcoming"}
          >
            <option value="">Tất cả ngày</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {dateLabel(d)}
              </option>
            ))}
          </select>
        </label>
        <span className="result-count">{filtered.length} phim</span>
      </div>
      {filtered.length ? (
        <div className="movie-grid catalog-grid">
          {filtered.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa tìm thấy bộ phim phù hợp">
          Thử tên phim hoặc thể loại khác nhé.
        </EmptyState>
      )}
    </div>
  );
};
