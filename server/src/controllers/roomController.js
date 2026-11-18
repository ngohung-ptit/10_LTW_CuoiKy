import { randomUUID } from "node:crypto";
import { Room, Show } from "../models/index.js";

const roomData = (body) => ({
  name: typeof body.name === "string" ? body.name.trim() : "",
  rows: Number(body.rows),
  columns: Number(body.columns),
  vipRows: Array.isArray(body.vipRows) ? [...new Set(body.vipRows)] : [],
});
const validRoom = (room) => room.name && Number.isInteger(room.rows) &&
  room.rows >= 1 && room.rows <= 12 && Number.isInteger(room.columns) &&
  room.columns >= 4 && room.columns <= 16 && room.vipRows.every((row) =>
    typeof row === "string" && /^[A-L]$/.test(row) && row.charCodeAt(0) < 65 + room.rows);
const duplicateName = async (name, id) => (await Room.findAll()).some((room) =>
  room.id !== id && room.name.toLowerCase() === name.toLowerCase());

const formatRoom = (room) => {
  const plain = room.toJSON ? room.toJSON() : room;
  let vipRows = plain.vipRows;
  if (typeof vipRows === "string") {
    try {
      vipRows = JSON.parse(vipRows);
    } catch {
      vipRows = [];
    }
  }
  return {
    ...plain,
    vipRows: Array.isArray(vipRows) ? vipRows : [],
  };
};

export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.findAll();
    res.status(200).json(rooms.map(formatRoom));
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({ error: "Không tìm thấy phòng chiếu." });
    }

    res.status(200).json(formatRoom(room));
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const data = roomData(req.body);
    if (!validRoom(data)) {
      return res.status(400).json({ error: "Nhập tên phòng, 1–12 hàng, 4–16 ghế mỗi hàng và hàng VIP hợp lệ." });
    }
    if (await duplicateName(data.name)) return res.status(409).json({ error: "Tên phòng đã tồn tại." });
    const room = await Room.create({ id: randomUUID(), ...data });

    res.status(201).json(formatRoom(room));
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({ error: "Không tìm thấy phòng chiếu." });
    }

    const data = roomData({ ...formatRoom(room), ...req.body });
    if (!validRoom(data)) return res.status(400).json({ error: "Cấu hình phòng hoặc hàng VIP không hợp lệ." });
    if (await duplicateName(data.name, id)) return res.status(409).json({ error: "Tên phòng đã tồn tại." });
    const changedLayout = data.rows !== room.rows || data.columns !== room.columns ||
      JSON.stringify(data.vipRows) !== JSON.stringify(room.vipRows);
    if (changedLayout && await Show.count({ where: { roomId: id } })) {
      return res.status(400).json({ error: "Phòng đang có suất chiếu, không thể đổi sơ đồ ghế." });
    }
    await room.update(data);

    res.status(200).json(formatRoom(room));
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: "Không tìm thấy phòng chiếu." });
    if (await Show.count({ where: { roomId: room.id } })) {
      return res.status(400).json({ error: "Không thể xóa phòng đang có suất chiếu." });
    }
    await room.destroy();
    res.json({ message: "Đã xóa phòng chiếu thành công." });
  } catch (error) { next(error); }
};
