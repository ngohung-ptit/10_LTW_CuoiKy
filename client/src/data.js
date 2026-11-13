// Local fixtures for frontend development; these are not a live cinema programme.
export const movies = [
  {
    id: "interstellar",
    title: "Interstellar",
    subtitle: "Hố đen tử thần",
    genre: "Khoa học viễn tưởng",
    duration: 169,
    year: 2014,
    age: "T13",
    director: "Christopher Nolan",
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
    poster: "interstellar.jpg",
    trailer: "zSWdZVtXT7E",
    status: "showing",
    description:
      "Khi Trái Đất không còn là mái nhà, Cooper cùng một nhóm phi hành gia đi qua hố sâu vũ trụ để tìm tương lai cho nhân loại. Một chuyến đi vượt qua khoảng cách, thời gian và tình cha con.",
  },
  {
    id: "dune",
    title: "Dune: Part Two",
    subtitle: "Hành tinh cát: Phần hai",
    genre: "Khoa học viễn tưởng",
    duration: 166,
    year: 2024,
    age: "T16",
    director: "Denis Villeneuve",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    poster: "dune.jpg",
    trailer: "Way9Dexny3w",
    status: "showing",
    description:
      "Paul Atreides sát cánh cùng Chani và người Fremen trên hành trình tìm lại công lý cho gia đình. Giữa tình yêu và vận mệnh, những lựa chọn của Paul sẽ thay đổi tương lai Arrakis.",
  },
  {
    id: "soul",
    title: "Soul",
    subtitle: "Cuộc sống nhiệm màu",
    genre: "Hoạt hình",
    duration: 100,
    year: 2020,
    age: "P",
    director: "Pete Docter",
    cast: "Jamie Foxx, Tina Fey",
    poster: "soul.jpg",
    trailer: "xOsLIiBStEs",
    status: "showing",
    description:
      "Joe Gardner, một giáo viên âm nhạc yêu jazz, bất ngờ lạc vào một thế giới nơi các linh hồn tìm thấy cá tính của mình. Cùng linh hồn 22, Joe khám phá những điều nhỏ bé làm nên cuộc sống.",
  },
  {
    id: "spirited-away",
    title: "Spirited Away",
    subtitle: "Vùng đất linh hồn",
    genre: "Hoạt hình",
    duration: 125,
    year: 2001,
    age: "P",
    director: "Hayao Miyazaki",
    cast: "Rumi Hiiragi, Miyu Irino",
    poster: "spirited.jpg",
    trailer: "ByXuk9QqQkk",
    status: "showing",
    description:
      "Cô bé Chihiro bước vào một thế giới kỳ lạ sau khi gia đình dừng chân tại một thị trấn bỏ hoang. Để cứu cha mẹ, cô phải học cách tự đứng vững và tìm lại con đường về nhà.",
  },
  {
    id: "inception",
    title: "Inception",
    subtitle: "Kẻ đánh cắp giấc mơ",
    genre: "Hành động",
    duration: 148,
    year: 2010,
    age: "T16",
    director: "Christopher Nolan",
    cast: "Leonardo DiCaprio, Joseph Gordon-Levitt",
    poster: "inception.jpg",
    trailer: "Qwe6qXFTdgc",
    status: "upcoming",
    description:
      "Dom Cobb có khả năng xâm nhập giấc mơ để đánh cắp bí mật. Nhiệm vụ cuối cùng đưa anh vào một mê cung nhiều tầng, nơi ranh giới giữa ký ức và thực tại dần biến mất.",
  },
  {
    id: "your-name",
    title: "Your Name",
    subtitle: "Tên cậu là gì?",
    genre: "Tình cảm",
    duration: 106,
    year: 2016,
    age: "T13",
    director: "Makoto Shinkai",
    cast: "Ryunosuke Kamiki, Mone Kamishiraishi",
    poster: "your-name.jpg",
    trailer: "xU47nhruN-Q",
    status: "upcoming",
    description:
      "Mitsuha sống ở một thị trấn miền núi, Taki sống giữa Tokyo. Những lần hoán đổi cơ thể bất ngờ kết nối hai người xa lạ trong một câu chuyện về ký ức và cuộc gặp gỡ.",
  },
];
export const initialRooms = [
  {
    id: "room-1",
    name: "Phòng 01",
    rows: 8,
    columns: 10,
    vipRows: ["D", "E", "F"],
  },
  { id: "room-2", name: "Phòng 02", rows: 6, columns: 8, vipRows: ["C", "D"] },
];
export const localDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const days = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return localDate(date);
});
export const initialShows = days.flatMap((date, dayIndex) =>
  movies
    .filter((m) => m.status === "showing")
    .flatMap((movie, i) => [
      {
        id: `${date}-${movie.id}-1`,
        movieId: movie.id,
        roomId: "room-1",
        date,
        time: ["10:00", "13:15", "16:30", "20:00"][i],
        price: 75000,
        vipPrice: 95000,
        sold: ["A3", "A4", "C5", "E6", "E7"].slice(0, 3 + (dayIndex % 3)),
      },
      {
        id: `${date}-${movie.id}-2`,
        movieId: movie.id,
        roomId: "room-2",
        date,
        time: ["20:00", "10:00", "13:15", "16:30"][i],
        price: 75000,
        vipPrice: 95000,
        sold: ["B3", "B4", "D5"],
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
