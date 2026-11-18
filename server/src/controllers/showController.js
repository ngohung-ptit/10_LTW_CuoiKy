import { Show, Movie, Room, Ticket, TicketSeat } from "../models/index.js";
import { buildShowBaseId, generateUniqueId } from "../utils/idGenerator.js";

const parseShowDateTime = (date, time) => {
  return new Date(`${date}T${time}:00+07:00`);
};

export const getShows = async (req, res, next) => {
  try {
    const { date, movieId, roomId } = req.query;
    const where = {};
    if (date) where.date = date;
    if (movieId) where.movieId = movieId;
    if (roomId) where.roomId = roomId;

    const shows = await Show.findAll({
      where,
      include: [
        { model: Movie, as: "movie" },
        { model: Room, as: "room" },
      ],
      order: [
        ["date", "ASC"],
        ["time", "ASC"],
      ],
    });

    const showIds = shows.map((s) => s.id);
    const activeSeats = await TicketSeat.findAll({
      where: { showId: showIds },
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: { status: "confirmed" },
          attributes: ["id", "status"],
        },
      ],
    });

    const soldMap = {};
    for (const seat of activeSeats) {
      if (!soldMap[seat.showId]) soldMap[seat.showId] = [];
      soldMap[seat.showId].push(seat.seatId);
    }

    const result = shows.map((s) => {
      const plain = s.toJSON();
      plain.sold = soldMap[s.id] || [];
      return plain;
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getShowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const show = await Show.findByPk(id, {
      include: [
        { model: Movie, as: "movie" },
        { model: Room, as: "room" },
      ],
    });

    if (!show) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const activeSeats = await TicketSeat.findAll({
      where: { showId: id },
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: { status: "confirmed" },
          attributes: ["id", "status"],
        },
      ],
    });

    const plain = show.toJSON();
    plain.sold = activeSeats.map((s) => s.seatId);

    res.status(200).json(plain);
  } catch (error) {
    next(error);
  }
};

const saveShow = async (req, res, next) => {
  try {
    const current = req.params.id ? await Show.findByPk(req.params.id) : null;
    if (req.params.id && !current) return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    if (current && await Ticket.count({ where: { showId: current.id } })) {
      return res.status(400).json({ error: "Suất đã có vé, không thể thay đổi thông tin." });
    }
    const { movieId, roomId, date, time, price, vipPrice } = { ...current?.toJSON(), ...req.body };

    if (!movieId || !roomId || !date || !time) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ phim, phòng chiếu, ngày và giờ chiếu." });
    }

    const movie = await Movie.findByPk(movieId);
    if (!movie) {
      return res.status(400).json({ error: "Phim được chọn không tồn tại." });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(400).json({ error: "Phòng chiếu được chọn không tồn tại." });
    }

    const startDateTime = parseShowDateTime(date, time);
    if (isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
      return res.status(400).json({ error: "Thời gian chiếu phải ở trong tương lai." });
    }

    const numPrice = Number(price ?? 75000);
    const numVipPrice = Number(vipPrice ?? 95000);
    if (!Number.isInteger(numPrice) || !Number.isInteger(numVipPrice) || numPrice <= 0 || numVipPrice < numPrice) {
      return res.status(400).json({ error: "Giá vé VIP không được thấp hơn giá vé thường." });
    }

    const start = startDateTime.getTime();
    const end = start + movie.duration * 60000;

    const existingShows = await Show.findAll({
      where: { roomId },
      include: [{ model: Movie, as: "movie" }],
    });

    const isOverlap = existingShows.some((s) => {
      const otherMovieDuration = s.movie?.duration || 120;
      const otherStart = parseShowDateTime(s.date, s.time).getTime();
      const otherEnd = otherStart + otherMovieDuration * 60000;

      return s.id !== current?.id && start < otherEnd && end > otherStart;
    });

    if (isOverlap) {
      return res.status(400).json({ error: "Suất chiếu bị chồng giờ với một suất khác trong cùng phòng." });
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
      show = await current.update(data);
    } else {
      const explicitId = req.body.id?.trim();
      const baseId = explicitId || buildShowBaseId({ date, movieId, roomId });
      const showId = explicitId ? explicitId : await generateUniqueId(baseId, (id) => Show.findByPk(id));
      show = await Show.create({ id: showId, ...data });
    }

    const plain = show.toJSON();
    plain.sold = [];
    res.status(current ? 200 : 201).json(plain);
  } catch (error) {
    next(error);
  }
};

export const createShow = saveShow;
export const updateShow = saveShow;

export const deleteShow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const show = await Show.findByPk(id);

    if (!show) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const bookedTickets = await Ticket.count({
      where: { showId: id },
    });
    if (bookedTickets > 0) {
      return res.status(400).json({ error: "Không thể xóa suất chiếu đã có vé được đặt." });
    }

    await show.destroy();
    res.status(200).json({ message: "Đã xóa suất chiếu thành công." });
  } catch (error) {
    next(error);
  }
};

