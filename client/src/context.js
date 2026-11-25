import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "./hooks";
import { getCurrentUser, loginAccount, registerAccount, logoutAccount } from "./auth";
import { api } from "./api";
import {
  initialRooms,
  initialShows,
  movies as initialMovies,
  showDate,
} from "./data";

const AppContext = createContext(null);

export const AppProvider = ({ children, initialUser = null, refreshKey }) => {
  const [user, setUser] = useState(() => initialUser || getCurrentUser());

  const authenticate = async (action, fields) => {
    const account =
      action === "register"
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

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [serverMovies, serverRooms, serverShows] = await Promise.all([
          api.get("/movies"),
          api.get("/rooms"),
          api.get("/shows"),
        ]);
        if (active) {
          if (Array.isArray(serverMovies)) setMovies(serverMovies);
          if (Array.isArray(serverRooms)) {
            const formattedRooms = serverRooms.map((r) => ({
              ...r,
              vipRows: Array.isArray(r.vipRows)
                ? r.vipRows
                : typeof r.vipRows === "string"
                ? JSON.parse(r.vipRows || "[]")
                : [],
            }));
            setRooms(formattedRooms);
          }
          if (Array.isArray(serverShows)) setShows(serverShows);
        }
      } catch (error) {
        if (active) {
          console.warn("Không thể tải dữ liệu API; đang dùng dữ liệu đã lưu.", error);
        }
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [refreshKey, setMovies, setRooms, setShows]);

  const book = (show, seats, total) => {
    let latest = tickets;
    try {
      latest = JSON.parse(localStorage.getItem("cinenep-tickets") || "[]");
    } catch {}

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
      userId: user?.id,
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

    api.post("/tickets", { showId: show.id, seats }).catch(() => {});

    return { ticket };
  };

  const cancelTicket = (id) => {
    const ticket = tickets.find((t) => t.id === id);
    if (
      !ticket ||
      ticket.userId !== user?.id ||
      showDate(ticket.show) - Date.now() < 7200000
    ) {
      return false;
    }

    setTickets((current) =>
      current.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
    );

    api.patch(`/tickets/${id}/cancel`).catch(() => {});

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
  return useMemo(() => {
    if (!show) return [];

    const occupiedSeats = [...show.sold];
    for (const ticket of tickets) {
      if (ticket.showId === show.id && ticket.status === "confirmed") {
        occupiedSeats.push(...ticket.seats);
      }
    }
    return occupiedSeats;
  }, [show, tickets]);
};
