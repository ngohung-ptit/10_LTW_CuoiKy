import { Show, Movie, Room, Ticket } from "../models/index.js";
import { buildShowBaseId, generateUniqueId } from "../utils/idGenerator.js";
import { buildPaginatedResponse, parsePagination, parseShowDateTime } from "../utils/queryHelpers.js";

const buildSoldMap = async (showIds) => {
  if (!showIds.length) return {};
  const activeTickets = await Ticket.find({
    showId: { $in: showIds },
    status: "confirmed",
  }).select("showId seats");

  const soldMap = {};
  for (const ticket of activeTickets) {
    if (!soldMap[ticket.showId]) soldMap[ticket.showId] = [];
    for (const seat of ticket.seats || []) {
      soldMap[ticket.showId].push(seat.seatId);
    }
  }
  return soldMap;
};

export const getShows = async (req, res, next) => {
  try {
    const { date, fromDate, movieId, roomId } = req.query;
    const filter = {};
    if (date) {
      filter.date = date;
    } else if (fromDate) {
      filter.date = { $gte: fromDate };
    }
    if (movieId) filter.movieId = movieId;
    if (roomId) filter.roomId = roomId;

    const pagination = parsePagination(req.query);
    const query = Show.find(filter)
      .populate("movie")
      .populate("room")
      .sort({ date: 1, time: 1 });

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }

    const [shows, total] = await Promise.all([
      query.exec(),
      pagination ? Show.countDocuments(filter) : Promise.resolve(0),
    ]);

    const showIds = shows.map((s) => s.id);
    const soldMap = await buildSoldMap(showIds);

    const result = shows.map((s) => ({
      ...s.toJSON(),
      sold: soldMap[s.id] || [],
    }));

    if (pagination) {
      res.set("X-Total-Count", String(total));
      return res.status(200).json(buildPaginatedResponse(result, total, pagination));
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getShowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const show = await Show.findById(id).populate("movie").populate("room");

    if (!show) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const soldMap = await buildSoldMap([id]);
    res.status(200).json({
      ...show.toJSON(),
      sold: soldMap[id] || [],
    });
  } catch (error) {
    next(error);
  }
};

const saveShow = async (req, res, next) => {
  try {
    const current = req.params.id ? await Show.findById(req.params.id) : null;
    if (req.params.id && !current) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    if (current && (await Ticket.exists({ showId: current.id }))) {
      return res.status(400).json({ error: "Suất đã có vé, không thể thay đổi thông tin." });
    }

    const { movieId, roomId, date, time, price, vipPrice } = {
      ...current?.toJSON(),
      ...req.body,
    };

    if (!movieId || !roomId || !date || !time) {
      return res.status(400).json({
        error: "Vui lòng nhập đầy đủ phim, phòng chiếu, ngày và giờ chiếu.",
      });
    }

    const [movie, room] = await Promise.all([
      Movie.findById(movieId),
      Room.findById(roomId),
    ]);

    if (!movie) {
      return res.status(400).json({ error: "Phim được chọn không tồn tại." });
    }
    if (!room) {
      return res.status(400).json({ error: "Phòng chiếu được chọn không tồn tại." });
    }

    const startDateTime = parseShowDateTime(date, time);
    if (Number.isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
      return res.status(400).json({ error: "Thời gian chiếu phải ở trong tương lai." });
    }

    const numPrice = Number(price ?? 75000);
    const numVipPrice = Number(vipPrice ?? 95000);
    if (
      !Number.isInteger(numPrice) ||
      !Number.isInteger(numVipPrice) ||
      numPrice <= 0 ||
      numVipPrice < numPrice
    ) {
      return res.status(400).json({ error: "Giá vé VIP không được thấp hơn giá vé thường." });
    }

    const start = startDateTime.getTime();
    const end = start + movie.duration * 60000;

    const existingShows = await Show.find({ roomId }).populate("movie");
    const isOverlap = existingShows.some((s) => {
      const otherMovieDuration = s.movie?.duration || 120;
      const otherStart = parseShowDateTime(s.date, s.time).getTime();
      const otherEnd = otherStart + otherMovieDuration * 60000;
      return s.id !== current?.id && start < otherEnd && end > otherStart;
    });

    if (isOverlap) {
      return res.status(400).json({
        error: "Suất chiếu bị chồng giờ với một suất khác trong cùng phòng.",
      });
    }

    const data = {
      movieId,
      roomId,
      date,
      time,
      price: numPrice,
      vipPrice: numVipPrice,
    };

    let show;
    if (current) {
      Object.assign(current, data);
      show = await current.save();
    } else {
      const explicitId = typeof req.body.id === "string" ? req.body.id.trim() : "";
      const baseId = explicitId || buildShowBaseId({ date, movieId, roomId });
      const showId =
        explicitId || (await generateUniqueId(baseId, (id) => Show.exists({ _id: id })));
      show = await Show.create({ _id: showId, ...data });
    }

    res.status(current ? 200 : 201).json({
      ...show.toJSON(),
      sold: [],
    });
  } catch (error) {
    next(error);
  }
};

export const createShow = saveShow;
export const updateShow = saveShow;

export const deleteShow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const hasTickets = await Ticket.exists({ showId: id });
    if (hasTickets) {
      return res.status(400).json({ error: "Không thể xóa suất chiếu đã có vé được đặt." });
    }

    await show.deleteOne();
    res.status(200).json({ message: "Đã xóa suất chiếu thành công." });
  } catch (error) {
    next(error);
  }
};
