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

const { daysCount, price, vipPrice, timesByRoom, dailySchedule, offlineSoldByRoom } =
  seedCatalog.showConfig;

export const days = Array.from({ length: daysCount }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return localDate(date);
});

export const initialShows = days.flatMap((date, dayIndex) =>
  Array.isArray(dailySchedule) && dailySchedule.length > 0
    ? dailySchedule.map((slot) => {
        const soldRoom = offlineSoldByRoom[slot.roomId] || [];
        const suffix = slot.roomId.replace(/^room-/, "");
        const timeTag = slot.time.replace(":", "");
        return {
          id: `${date}-${slot.movieId}-${suffix}-${timeTag}`,
          movieId: slot.movieId,
          roomId: slot.roomId,
          date,
          time: slot.time,
          price,
          vipPrice,
          sold:
            slot.roomId === "room-1"
              ? soldRoom.slice(0, 3 + (dayIndex % 3))
              : soldRoom,
        };
      })
    : movies
        .filter((m) => m.status === "showing")
        .flatMap((movie, i) =>
          initialRooms.flatMap((room, roomIdx) => {
            const roomTimes = timesByRoom[room.id] || [];
            if (roomTimes.length === 0) return [];
            const soldRoom = offlineSoldByRoom[room.id] || [];
            const suffix = room.id.replace(/^room-/, "") || String(roomIdx + 1);
            return [
              {
                id: `${date}-${movie.id}-${suffix}`,
                movieId: movie.id,
                roomId: room.id,
                date,
                time: roomTimes[i % roomTimes.length],
                price,
                vipPrice,
                sold:
                  room.id === "room-1"
                    ? soldRoom.slice(0, 3 + (dayIndex % 3))
                    : soldRoom,
              },
            ];
          }),
        ),
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
