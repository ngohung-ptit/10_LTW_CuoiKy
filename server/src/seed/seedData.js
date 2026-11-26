import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { connectDB, disconnectDB } from "../config/database.js";
import { User, Movie, Room, Show, Ticket, Coupon, normalizeDocIds } from "../models/index.js";

const seedCatalog = JSON.parse(
  fs.readFileSync(new URL("./seedData.json", import.meta.url), "utf8")
);

const {
  movies: initialMovies,
  rooms: initialRooms,
  coupons: rawCoupons,
  showConfig,
} = seedCatalog;

const initialCoupons = rawCoupons.map(({ code, ...rest }) => ({
  _id: code,
  code,
  ...rest,
}));

const localDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const seedDatabase = async ({ closeConnection = true } = {}) => {
  const conn = await connectDB();

  await Promise.all([
    Ticket.deleteMany({}),
    Show.deleteMany({}),
    Room.deleteMany({}),
    Movie.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({}),
  ]);

  await Promise.all([
    User.syncIndexes(),
    Movie.syncIndexes(),
    Room.syncIndexes(),
    Show.syncIndexes(),
    Ticket.syncIndexes(),
    Coupon.syncIndexes(),
  ]);

  const [adminPassword, memberPassword] = await Promise.all([
    bcrypt.hash("Admin@12345", 10),
    bcrypt.hash("Member@12345", 10),
  ]);

  await User.insertMany([
    {
      _id: "udu-admin",
      name: "Quản trị UDU",
      email: "admin@udu.example",
      password: adminPassword,
      role: "admin",
    },
    {
      _id: "udu-member",
      name: "Bạn yêu phim",
      email: "member@udu.example",
      password: memberPassword,
      role: "member",
    },
  ]);

  await Movie.insertMany(normalizeDocIds(initialMovies));
  await Room.insertMany(normalizeDocIds(initialRooms));
  await Coupon.insertMany(initialCoupons);

  const showingMovies = initialMovies.filter((m) => m.status === "showing");
  const { daysCount, price, vipPrice, timesByRoom, dailySchedule } = showConfig;
  const shows = [];

  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    const d = new Date();
    d.setDate(d.getDate() + dayIndex);
    const dateStr = localDate(d);

    if (Array.isArray(dailySchedule) && dailySchedule.length > 0) {
      dailySchedule.forEach((slot) => {
        const suffix = slot.roomId.replace(/^room-/, "");
        const timeTag = slot.time.replace(":", "");
        shows.push({
          _id: `${dateStr}-${slot.movieId}-${suffix}-${timeTag}`,
          movieId: slot.movieId,
          roomId: slot.roomId,
          date: dateStr,
          time: slot.time,
          price,
          vipPrice,
        });
      });
    } else {
      showingMovies.forEach((movie, i) => {
        initialRooms.forEach((room, roomIdx) => {
          const roomTimes = timesByRoom[room.id] || [];
          if (roomTimes.length === 0) return;
          const suffix = room.id.replace(/^room-/, "") || String(roomIdx + 1);
          shows.push({
            _id: `${dateStr}-${movie.id}-${suffix}`,
            movieId: movie.id,
            roomId: room.id,
            date: dateStr,
            time: roomTimes[i % roomTimes.length],
            price,
            vipPrice,
          });
        });
      });
    }
  }

  await Show.insertMany(shows);

  const firstShow = shows[2] || shows[0];
  const firstShowRoom = initialRooms.find((r) => r.id === firstShow.roomId);
  const ticketId = `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const qrCode = await QRCode.toDataURL(ticketId).catch(() => null);

  await Ticket.create({
    _id: ticketId,
    userId: "udu-member",
    showId: firstShow._id,
    movieId: firstShow.movieId,
    roomName: firstShowRoom?.name || "Phòng 01",
    seats: [
      { seatId: "A3", price },
      { seatId: "D5", price: vipPrice },
    ],
    total: price + vipPrice,
    discount: 0,
    couponCode: null,
    status: "confirmed",
    qrCode,
  });

  const dbName = conn.name;
  if (closeConnection) {
    await disconnectDB();
  }
  return dbName;
};

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  seedDatabase({ closeConnection: true })
    .then((dbName) => {
      console.log(`MongoDB seed completed successfully (database: ${dbName}).`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("MongoDB seed error:", error);
      process.exit(1);
    });
}
