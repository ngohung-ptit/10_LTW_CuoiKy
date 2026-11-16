import { Room } from "../models/index.js";

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
    const { id, name, rows, columns, vipRows } = req.body;
    if (!name || !rows || !columns) {
      return res.status(400).json({ error: "Vui lòng nhập tên phòng, số hàng và số ghế mỗi hàng." });
    }

    const roomId = id?.trim() || `room-${Date.now()}`;
    const room = await Room.create({
      id: roomId,
      name: name.trim(),
      rows: Number(rows),
      columns: Number(columns),
      vipRows: Array.isArray(vipRows) ? vipRows : [],
    });

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

    await room.update({
      name: req.body.name ?? room.name,
      rows: req.body.rows ? Number(req.body.rows) : room.rows,
      columns: req.body.columns ? Number(req.body.columns) : room.columns,
      vipRows: req.body.vipRows ?? room.vipRows,
    });

    res.status(200).json(formatRoom(room));
  } catch (error) {
    next(error);
  }
};
