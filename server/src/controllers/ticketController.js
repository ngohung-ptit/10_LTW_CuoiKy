import QRCode from "qrcode";
import { sequelize } from "../config/database.js";
import { Ticket, TicketSeat, Show, Movie, Room, Coupon } from "../models/index.js";

const parseShowDateTime = (date, time) => {
  return new Date(`${date}T${time}:00+07:00`);
};

export const createTicket = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user.id;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một ghế." });
    }

    if (seats.length > 8) {
      return res.status(400).json({ error: "Chỉ được đặt tối đa 8 ghế cho mỗi lần đặt." });
    }

    const show = await Show.findByPk(showId, {
      include: [
        { model: Movie, as: "movie" },
        { model: Room, as: "room" },
      ],
    });

    if (!show) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const showDateTime = parseShowDateTime(show.date, show.time);
    if (showDateTime <= new Date()) {
      return res.status(400).json({ error: "Suất chiếu này đã bắt đầu hoặc đã qua." });
    }

    const room = show.room;
    const vipRows = Array.isArray(room.vipRows) ? room.vipRows : [];

    const result = await sequelize.transaction(async (t) => {
      const activeSeats = await TicketSeat.findAll({
        where: { showId },
        include: [
          {
            model: Ticket,
            as: "ticket",
            where: { status: "confirmed" },
            attributes: ["id", "status"],
          },
        ],
        transaction: t,
        lock: true,
      });

      const occupiedSeatIds = activeSeats.map((s) => s.seatId);
      const conflicts = seats.filter((seatId) => occupiedSeatIds.includes(seatId));

      if (conflicts.length > 0) {
        const error = new Error("Một số ghế bạn chọn vừa có người khác đặt.");
        error.status = 409;
        error.details = { conflicts };
        throw error;
      }

      let total = 0;
      const seatRecords = [];
      const ticketId = `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      for (const seatId of seats) {
        const rowLetter = seatId[0];
        const isVip = vipRows.includes(rowLetter);
        const seatPrice = isVip ? show.vipPrice : show.price;
        total += seatPrice;

        seatRecords.push({
          ticketId,
          showId,
          seatId,
          price: seatPrice,
        });
      }

      let qrCode = null;
      try {
        qrCode = await QRCode.toDataURL(ticketId);
      } catch {
        qrCode = null;
      }

      const ticket = await Ticket.create(
        {
          id: ticketId,
          userId,
          showId,
          movieId: show.movieId,
          roomName: room.name,
          total,
          status: "confirmed",
          qrCode,
        },
        { transaction: t }
      );

      await TicketSeat.bulkCreate(seatRecords, { transaction: t });

      return {
        ticket: {
          ...ticket.toJSON(),
          seats,
          show: show.toJSON(),
        },
      };
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("seatsBooked", { showId, seats });
    }

    res.status(201).json(result);
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({
        error: error.message,
        conflicts: error.details?.conflicts || [],
      });
    }
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status && status !== "all") {
      where.status = status;
    }

    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: TicketSeat, as: "seats", attributes: ["seatId", "price"] },
        {
          model: Show,
          as: "show",
          include: [
            { model: Movie, as: "movie" },
            { model: Room, as: "room" },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = tickets.map((t) => {
      const plain = t.toJSON();
      return {
        ...plain,
        seats: plain.seats ? plain.seats.map((s) => s.seatId) : [],
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: Show, as: "show" },
        { model: TicketSeat, as: "seats" },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé." });
    }

    if (ticket.userId !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Bạn không có quyền thao tác trên vé này." });
    }

    if (ticket.status === "cancelled") {
      return res.status(400).json({ error: "Vé này đã được hủy trước đó." });
    }

    const showDateTime = parseShowDateTime(ticket.show.date, ticket.show.time);
    const diffMs = showDateTime.getTime() - Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs < twoHoursMs) {
      return res.status(400).json({ error: "Không thể hủy vé trong vòng 2 giờ trước suất chiếu." });
    }

    ticket.status = "cancelled";
    await ticket.save();

    const io = req.app.get("io");
    if (io) {
      const seats = ticket.seats.map((s) => s.seatId);
      io.emit("seatsReleased", { showId: ticket.showId, seats });
    }

    res.status(200).json({
      message: "Hủy vé thành công. Chỗ ngồi đã được hoàn lại.",
      ticketId: ticket.id,
    });
  } catch (error) {
    next(error);
  }
};

