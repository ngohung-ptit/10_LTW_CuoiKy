import { Op } from "sequelize";
import { Movie, Show } from "../models/index.js";

export const getMovies = async (req, res, next) => {
  try {
    const { search, status, genre } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    if (genre) {
      where.genre = genre;
    }
    if (search) {
      where.title = { [Op.like]: `%${search.trim()}%` };
    }

    const movies = await Movie.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id, {
      include: [{ model: Show, as: "shows" }],
    });

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
    const {
      id,
      title,
      subtitle,
      genre,
      duration,
      year,
      age,
      director,
      cast,
      poster,
      trailer,
      status,
      description,
    } = req.body;

    if (!title || !genre || !duration) {
      return res.status(400).json({ error: "Vui lòng nhập tên phim, thể loại và thời lượng." });
    }

    const movieId =
      id?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const movie = await Movie.create({
      id: movieId,
      title: title.trim(),
      subtitle: subtitle?.trim(),
      genre: genre.trim(),
      duration: Number(duration),
      year: Number(year) || new Date().getFullYear(),
      age: age || "P",
      director: director?.trim(),
      cast: cast?.trim(),
      poster: poster?.trim() || "interstellar.jpg",
      trailer: trailer?.trim(),
      status: status || "showing",
      description: description?.trim(),
    });

    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id);

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim để cập nhật." });
    }

    await movie.update(req.body);
    res.status(200).json(movie);
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id);

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim để xóa." });
    }

    const hasShows = await Show.count({ where: { movieId: id } });
    if (hasShows > 0) {
      return res.status(400).json({ error: "Không thể xóa phim đang có suất chiếu." });
    }

    await movie.destroy();
    res.status(200).json({ message: "Đã xóa phim thành công." });
  } catch (error) {
    next(error);
  }
};

