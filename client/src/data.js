import seedCatalog from "./seedData.json";

export const movies = seedCatalog.movies;
export const initialRooms = seedCatalog.rooms;
export const initialCoupons = seedCatalog.coupons;

export const localDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const { daysCount, price, vipPrice, timesByRoom, offlineSoldByRoom } =
  seedCatalog.showConfig;

export const days = Array.from({ length: daysCount }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return localDate(date);
});

const times1 = timesByRoom["room-1"];
const times2 = timesByRoom["room-2"];
const soldRoom1 = offlineSoldByRoom["room-1"];
const soldRoom2 = offlineSoldByRoom["room-2"];

export const initialShows = days.flatMap((date, dayIndex) =>
  movies
    .filter((m) => m.status === "showing")
    .flatMap((movie, i) => [
      {
        id: `${date}-${movie.id}-1`,
        movieId: movie.id,
        roomId: "room-1",
        date,
        time: times1[i % times1.length],
        price,
        vipPrice,
        sold: soldRoom1.slice(0, 3 + (dayIndex % 3)),
      },
      {
        id: `${date}-${movie.id}-2`,
        movieId: movie.id,
        roomId: "room-2",
        date,
        time: times2[i % times2.length],
        price,
        vipPrice,
        sold: soldRoom2,
      },
    ]),
);

export const showDate = (show) =>
  new Date(`${show.date}T${show.time}:00+07:00`);
export const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${value}T12:00:00+07:00`));
export const normalise = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

export const parseVipRows = (vipRows) => {
  if (Array.isArray(vipRows)) return vipRows;
  if (typeof vipRows === "string") {
    try {
      const parsed = JSON.parse(vipRows || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
