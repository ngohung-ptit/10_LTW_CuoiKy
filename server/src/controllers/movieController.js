import { Movie, Show } from "../models/index.js";
import { buildMovieBaseId, escapeRegex } from "../utils/idGenerator.js";
import { buildPaginatedResponse, parsePagination } from "../utils/queryHelpers.js";

const ALLOWED_AGES = new Set(["P", "T13", "T16", "T18"]);
const ALLOWED_STATUSES = new Set(["showing", "upcoming"]);
const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

const buildMoviePayload = (body, existing = null) => {
  const merged = {
    title: body.title !== undefined ? body.title : existing?.title,
    subtitle: body.subtitle !== undefined ? body.subtitle : existing?.subtitle,
    genre: body.genre !== undefined ? body.genre : existing?.genre,
    duration: body.duration !== undefined ? body.duration : existing?.duration,
    year: body.year !== undefined ? body.year : existing?.year,
    age: body.age !== undefined ? body.age : existing?.age,
    director: body.director !== undefined ? body.director : existing?.director,
    cast: body.cast !== undefined ? body.cast : existing?.cast,
    poster: body.poster !== undefined ? body.poster : existing?.poster,
    trailer: body.trailer !== undefined ? body.trailer : existing?.trailer,
    status: body.status !== undefined ? body.status : existing?.status,
    description: body.description !== undefined ? body.description : existing?.description,
  };

  return {
    title: typeof merged.title === "string" ? merged.title.trim() : "",
    subtitle: typeof merged.subtitle === "string" ? merged.subtitle.trim() : "",
    genre: typeof merged.genre === "string" ? merged.genre.trim() : "",
    duration: Number(merged.duration),
    year: Number(merged.year) || new Date().getFullYear(),
    age: ALLOWED_AGES.has(merged.age) ? merged.age : "P",
    director: typeof merged.director === "string" ? merged.director.trim() : "",
    cast: typeof merged.cast === "string" ? merged.cast.trim() : "",
    poster: typeof merged.poster === "string" && merged.poster.trim() ? merged.poster.trim() : "the-odyssey.jpg",
    trailer: typeof merged.trailer === "string" ? merged.trailer.trim() : "",
    status: ALLOWED_STATUSES.has(merged.status) ? merged.status : "showing",
    description: typeof merged.description === "string" ? merged.description.trim() : "",
  };
};

export const getMovies = async (req, res, next) => {
  try {
    const { search, status, genre, minDuration, maxDuration, yearFrom } = req.query;
    const filter = {};

    if (status && ALLOWED_STATUSES.has(status)) {
      filter.status = status;
    }

    if (genre && genre !== "all") {
      const genres = String(genre)
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
      filter.genre = genres.length > 1 ? { $in: genres } : genres[0];
    }

    if (search && String(search).trim()) {
      const regex = { $regex: escapeRegex(String(search).trim()), $options: "i" };
      filter.$or = [{ title: regex }, { subtitle: regex }];
    }

    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = Number(minDuration);
      if (maxDuration) filter.duration.$lte = Number(maxDuration);
    }

    if (yearFrom) {
      filter.year = { $gte: Number(yearFrom) };
    }

    const pagination = parsePagination(req.query);
    if (pagination) {
      const [movies, total] = await Promise.all([
        Movie.find(filter)
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit),
        Movie.countDocuments(filter),
      ]);
      res.set("X-Total-Count", String(total));
      return res.status(200).json(buildPaginatedResponse(movies, total, pagination));
    }

    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id).populate("shows");

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim yêu cầu." });
    }

    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const payload = buildMoviePayload(req.body);
    if (
      !payload.title ||
      !payload.genre ||
      !Number.isInteger(payload.duration) ||
      payload.duration < 1 ||
      payload.duration > 360
    ) {
      return res.status(400).json({
        error: "Vui lòng nhập tên phim, thể loại và thời lượng hợp lệ (1–360 phút).",
      });
    }

    if (payload.trailer && !YOUTUBE_ID_PATTERN.test(payload.trailer)) {
      return res.status(400).json({ error: "Mã video YouTube phải có đúng 11 ký tự." });
    }

    const explicitId = typeof req.body.id === "string" ? req.body.id.trim() : "";
    const movieId = explicitId || buildMovieBaseId(payload.title);

    if (!movieId) {
      return res.status(400).json({ error: "Tên phim cần có chữ hoặc số để tạo mã phim." });
    }

    const movie = await Movie.create({
      _id: movieId,
      ...payload,
    });

    res.status(201).json(movie);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Mã phim đã tồn tại. Từ đầu tiên của tên phim phải khác phim đã có.",
      });
    }
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim để cập nhật." });
    }

    const payload = buildMoviePayload(req.body, movie);
    if (
      !payload.title ||
      !payload.genre ||
      !Number.isInteger(payload.duration) ||
      payload.duration < 1 ||
      payload.duration > 360
    ) {
      return res.status(400).json({
        error: "Tên phim, thể loại và thời lượng (1–360 phút) không hợp lệ.",
      });
    }

    if (payload.trailer && !YOUTUBE_ID_PATTERN.test(payload.trailer)) {
      return res.status(400).json({ error: "Mã video YouTube phải có đúng 11 ký tự." });
    }

    Object.assign(movie, payload);
    await movie.save();

    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim để xóa." });
    }

    const hasShows = await Show.exists({ movieId: id });
    if (hasShows) {
      return res.status(400).json({ error: "Không thể xóa phim đang có suất chiếu." });
    }

    await movie.deleteOne();
    res.status(200).json({ message: "Đã xóa phim thành công." });
  } catch (error) {
    next(error);
  }
};
