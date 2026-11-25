import crypto from "crypto";
import QRCode from "qrcode";
import { Ticket, Show, Coupon } from "../models/index.js";
import { buildPaginatedResponse, parsePagination, parseShowDateTime } from "../utils/queryHelpers.js";

const isValidSeatForRoom = (seatId, room) => {
  const match = /^([A-L])(\d+)$/.exec(String(seatId || ""));
  if (!match) return false;
  const rowIndex = match[1].charCodeAt(0) - 65;
  const colNum = parseInt(match[2], 10);
  return rowIndex >= 0 && rowIndex < room.rows && colNum >= 1 && colNum <= room.columns;
};

const findConflictingSeats = async (showId, seats) => {
  const existing = await Ticket.find({
    showId,
    status: "confirmed",
    "seats.seatId": { $in: seats },
  }).select("seats");

  const occupied = new Set();
  for (const ticket of existing) {
    for (const item of ticket.seats || []) {
      occupied.add(item.seatId);
    }
  }
  return seats.filter((seatId) => occupied.has(seatId));
};

export const createTicket = async (req, res, next) => {
  try {
    const { showId, seats, couponCode } = req.body;
    const userId = req.user.id;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một ghế." });
    }

    const uniqueSeats = [...new Set(seats.map((s) => String(s).trim().toUpperCase()))];
    if (uniqueSeats.length !== seats.length) {
      return res.status(400).json({ error: "Danh sách ghế chọn không được trùng lặp." });
    }
    if (uniqueSeats.length > 8) {
      return res.status(400).json({ error: "Chỉ được đặt tối đa 8 ghế cho mỗi lần đặt." });
    }

    const show = await Show.findById(showId).populate("movie").populate("room");
    if (!show || !show.room) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu." });
    }

    const showDateTime = parseShowDateTime(show.date, show.time);
    if (showDateTime <= new Date()) {
      return res.status(400).json({ error: "Suất chiếu này đã bắt đầu hoặc đã qua." });
    }

    const room = show.room;
    const invalidSeat = uniqueSeats.find((seatId) => !isValidSeatForRoom(seatId, room));
    if (invalidSeat) {
      return res.status(400).json({ error: `Ghế ${invalidSeat} không hợp lệ trong ${room.name}.` });
    }

    const conflicts = await findConflictingSeats(showId, uniqueSeats);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: "Một số ghế bạn chọn vừa có người khác đặt.",
        conflicts,
      });
    }

    const vipRows = Array.isArray(room.vipRows) ? room.vipRows : [];
    let rawTotal = 0;
    const seatRecords = uniqueSeats.map((seatId) => {
      const seatPrice = vipRows.includes(seatId[0]) ? show.vipPrice : show.price;
      rawTotal += seatPrice;
      return { seatId, price: seatPrice };
    });

    let discount = 0;
    let appliedCouponCode = null;
    if (couponCode && String(couponCode).trim()) {
      const normalizedCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ _id: normalizedCode, isActive: true });
      if (!coupon) {
        return res.status(400).json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn." });
      }
      discount = Math.min(
        Math.round((rawTotal * coupon.discountPercent) / 100),
        coupon.maxDiscount
      );
      appliedCouponCode = coupon.code;
    }

    const total = Math.max(0, rawTotal - discount);
    const ticketId = `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    let qrCode = null;
    try {
      qrCode = await QRCode.toDataURL(ticketId);
    } catch {
      qrCode = null;
    }

    let ticket;
    try {
      ticket = await Ticket.create({
        _id: ticketId,
        userId,
        showId,
        movieId: show.movieId,
        roomName: room.name,
        seats: seatRecords,
        total,
        discount,
        couponCode: appliedCouponCode,
        status: "confirmed",
        qrCode,
      });
    } catch (error) {
      if (error.code === 11000) {
        const raceConflicts = await findConflictingSeats(showId, uniqueSeats);
        return res.status(409).json({
          error: "Một số ghế bạn chọn vừa có người khác đặt.",
          conflicts: raceConflicts.length ? raceConflicts : uniqueSeats,
        });
      }
      throw error;
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("seatsBooked", { showId, seats: uniqueSeats });
    }

    res.status(201).json({
      ticket: {
        ...ticket.toJSON(),
        show: show.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { userId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const pagination = parsePagination(req.query);
    const query = Ticket.find(filter)
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "room" }],
      })
      .sort({ createdAt: -1 });

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }

    const [tickets, total] = await Promise.all([
      query.exec(),
      pagination ? Ticket.countDocuments(filter) : Promise.resolve(0),
    ]);

    if (pagination) {
      res.set("X-Total-Count", String(total));
      return res.status(200).json(buildPaginatedResponse(tickets, total, pagination));
    }

    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id).populate("show");
    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé." });
    }

    if (ticket.userId !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Bạn không có quyền thao tác trên vé này." });
    }

    if (ticket.status === "cancelled") {
      return res.status(400).json({ error: "Vé này đã được hủy trước đó." });
    }

    if (!ticket.show) {
      return res.status(400).json({ error: "Không tìm thấy suất chiếu của vé này." });
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
      const releasedSeats = (ticket.seats || []).map((s) => s.seatId);
      io.emit("seatsReleased", { showId: ticket.showId, seats: releasedSeats });
    }

    res.status(200).json({
      message: "Hủy vé thành công. Chỗ ngồi đã được hoàn lại.",
      ticketId: ticket.id,
    });
  } catch (error) {
    next(error);
  }
};
