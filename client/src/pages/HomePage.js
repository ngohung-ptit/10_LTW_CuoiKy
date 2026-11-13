import { Link } from "react-router-dom";
import { useApp } from "../context";
import { MovieCard } from "../components";
import "./HomePage.css";

// Trang chủ chỉ giới thiệu phim. Tìm kiếm và bộ lọc nằm ở trang Phim.
export const HomePage = () => {
  const { movies } = useApp();
  const showingMovies = movies.filter((movie) => movie.status === "showing");
  const featuredMovie = showingMovies[0];
  const otherMovies = showingMovies.slice(1, 4);

  return (
    <div className="home-page">
      <section className="home-intro">
        <div className="wrap home-intro-content">
          <div className="home-intro-text">
            <p className="eyebrow">UDU cinematic</p>
            <h1>Đặt vé xem phim<br />tại UDU cinematic.</h1>
            <p className="home-description">Xem lịch chiếu, chọn chỗ ngồi và lưu vé cho buổi phim của bạn.</p>
            {featuredMovie && (
              <div className="home-featured-info">
                <span className="eyebrow">Phim tiêu điểm</span>
                <h2>{featuredMovie.title}</h2>
                <p>{featuredMovie.genre} · {featuredMovie.duration} phút · {featuredMovie.age}</p>
                <Link className="btn btn--primary" to={`/phim/${featuredMovie.id}`}>Xem phim và đặt vé</Link>
              </div>
            )}
            {!featuredMovie && <Link className="btn btn--primary" to="/phim">Xem danh sách phim</Link>}
          </div>
          {featuredMovie && (
            <Link className="home-featured-poster m-zoom" to={`/phim/${featuredMovie.id}`} aria-label={`Xem chi tiết ${featuredMovie.title}`}>
              <img src={`/assets/images/${featuredMovie.poster}`} srcSet={`/assets/images/${featuredMovie.poster.replace('.jpg', '-small.jpg')} 342w, /assets/images/${featuredMovie.poster} 500w`} sizes="(max-width: 639px) 180px, (max-width: 1023px) 280px, 360px" alt={`Áp phích ${featuredMovie.title}`} width="500" height="750" fetchPriority="high" />
            </Link>
          )}
        </div>
      </section>

      {otherMovies.length > 0 && (
        <section className="home-preview">
          <div className="wrap">
            <div className="section-heading">
              <h2>Phim đang chiếu</h2>
              <Link className="link" to="/phim">Xem tất cả phim →</Link>
            </div>
            <div className="movie-grid">
              {otherMovies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
