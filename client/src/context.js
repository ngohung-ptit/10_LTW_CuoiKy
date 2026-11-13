import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "./hooks";
import { getCurrentUser, loginAccount, registerAccount, logoutAccount } from "./auth";
import {
  initialRooms,
  initialShows,
  movies as initialMovies,
  showDate,
} from "./data";

const AppContext = createContext(null);
export const AppProvider = ({ children, initialUser = null }) => {
  const [user, setUser] = useState(() => initialUser || getCurrentUser());
  const authenticate = async (action, fields) => {
    const account = action === "register"
      ? await registerAccount(fields)
      : await loginAccount(fields);
    setUser(account);
    return account;
  };
  const logout = () => {
    logoutAccount();
    setUser(null);
  };
  const [movies, setMovies] = useLocalStorage("cinenep-movies", initialMovies);
  const [rooms, setRooms] = useLocalStorage("cinenep-rooms", initialRooms);
  const [shows, setShows] = useLocalStorage("cinenep-shows-v1", initialShows);
  const [tickets, setTickets] = useLocalStorage("cinenep-tickets", []);
  const [notice, setNotice] = useState("");
  const notify = useCallback((message) => setNotice(message), []);
  const book = (show, seats, total) => {
    // Đọc lại vé trong trình duyệt trước khi xác nhận, phòng trường hợp tab khác vừa đặt.
    let latest = tickets;
    try {
      latest = JSON.parse(localStorage.getItem("cinenep-tickets") || "[]");
    } catch {
      // Nếu không đọc được dữ liệu lưu, dùng danh sách vé trong state.
    }
    const occupied = [...show.sold];
    for (const ticket of latest) {
      if (ticket.showId === show.id && ticket.status === "confirmed") {
        occupied.push(...ticket.seats);
      }
    }
    const conflicts = seats.filter((seatId) => occupied.includes(seatId));
    if (conflicts.length) {
      setTickets(latest);
      return { conflicts };
    }
    const ticket = {
      id: `UDU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      userId: user.id,
      showId: show.id,
      movieId: show.movieId,
      seats: [...seats],
      total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      show: { ...show },
      roomName: rooms.find((r) => r.id === show.roomId)?.name,
    };
    const next = [ticket, ...latest];
    localStorage.setItem("cinenep-tickets", JSON.stringify(next));
    setTickets(next);
    return { ticket };
  };
  const cancelTicket = (id) => {
    const ticket = tickets.find((t) => t.id === id);
    if (
      !ticket ||
      ticket.userId !== user?.id ||
      showDate(ticket.show) - Date.now() < 7200000
    )
      return false;
    setTickets((current) =>
      current.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)),
    );
    return true;
  };
  const value = {
    user,
    authenticate,
    logout,
    movies,
    setMovies,
    rooms,
    setRooms,
    shows,
    setShows,
    tickets,
    book,
    cancelTicket,
    notice,
    notify,
  };
  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite">
        {notice}
      </div>
    </AppContext.Provider>
  );
};
export const useApp = () => useContext(AppContext);
export const useOccupied = (show) => {
  const { tickets } = useApp();
  return useMemo(
    () => {
      if (!show) return [];

      // Mảng mới, không thay đổi dữ liệu ghế gốc của suất chiếu.
      const occupiedSeats = [...show.sold];
      for (const ticket of tickets) {
        if (ticket.showId === show.id && ticket.status === "confirmed") {
          occupiedSeats.push(...ticket.seats);
        }
      }
      return occupiedSeats;
    },
    [show, tickets],
  );
};
