import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";
import { User, Movie, Room, Show, Ticket, TicketSeat } from "../models/index.js";

const initialMovies = [
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

const initialRooms = [
  {
    id: "room-1",
    name: "Phòng 01",
    rows: 8,
    columns: 10,
    vipRows: ["D", "E", "F"],
  },
  {
    id: "room-2",
    name: "Phòng 02",
    rows: 6,
    columns: 8,
    vipRows: ["C", "D"],
  },
];

const localDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const adminPassword = await bcrypt.hash("Admin@12345", 10);
    const memberPassword = await bcrypt.hash("Member@12345", 10);

    const adminUser = await User.create({
      id: "udu-admin",
      name: "Quản trị UDU",
      email: "admin@udu.example",
      password: adminPassword,
      role: "admin",
    });

    const memberUser = await User.create({
      id: "udu-member",
      name: "Bạn yêu phim",
      email: "member@udu.example",
      password: memberPassword,
      role: "member",
    });

    await Movie.bulkCreate(initialMovies);
    await Room.bulkCreate(initialRooms);

    const showingMovies = initialMovies.filter((m) => m.status === "showing");
    const shows = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const d = new Date();
      d.setDate(d.getDate() + dayIndex);
      const dateStr = localDate(d);

      showingMovies.forEach((movie, i) => {
        const times1 = ["10:00", "13:15", "16:30", "20:00"];
        const times2 = ["20:00", "10:00", "13:15", "16:30"];

        shows.push({
          id: `${dateStr}-${movie.id}-1`,
          movieId: movie.id,
          roomId: "room-1",
          date: dateStr,
          time: times1[i % times1.length],
          price: 75000,
          vipPrice: 95000,
        });

        shows.push({
          id: `${dateStr}-${movie.id}-2`,
          movieId: movie.id,
          roomId: "room-2",
          date: dateStr,
          time: times2[i % times2.length],
          price: 75000,
          vipPrice: 95000,
        });
      });
    }

    await Show.bulkCreate(shows);

    const firstShow = shows[0];
    const ticketId = `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    await Ticket.create({
      id: ticketId,
      userId: memberUser.id,
      showId: firstShow.id,
      movieId: firstShow.movieId,
      roomName: "Phòng 01",
      total: 170000,
      status: "confirmed",
      qrCode: null,
    });

    await TicketSeat.bulkCreate([
      {
        ticketId,
        showId: firstShow.id,
        seatId: "A3",
        price: 75000,
      },
      {
        ticketId,
        showId: firstShow.id,
        seatId: "D5",
        price: 95000,
      },
    ]);

    console.log("Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();

