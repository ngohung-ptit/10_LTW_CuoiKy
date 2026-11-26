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
import { api, getToken } from "./api";
import {
  parseVipRows,
  showDate,
} from "./data";

const AppContext = createContext(null);
const extractList = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : null;

export const AppProvider = ({ children, initialUser = null, refreshKey }) => {
  const [user, setUser] = useState(() => initialUser || getCurrentUser());
  const [theme, setTheme] = useLocalStorage("udu-theme", "light");
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [shows, setShows] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notice, setNotice] = useState("");
  const [dataError, setDataError] = useState("");
  const [ticketsError, setTicketsError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const notify = useCallback((message) => setNotice(message), []);

  useEffect(() => {
    let active = true;
    setTicketsError("");
    if (user?.id && getToken()) {
      api.get("/tickets/my-tickets")
        .then((res) => {
          if (active) setTickets(extractList(res) || []);
        })
        .catch(() => {
          if (active) setTicketsError("Không thể tải vé của bạn. Vui lòng tải lại trang.");
        });
    }
    return () => { active = false; };
  }, [user?.id, refreshKey]);

  const syncShowSold = useCallback(
    (showId, soldSeats) => {
      if (!Array.isArray(soldSeats)) return;
      setShows((current) =>
        current.map((s) => (s.id === showId ? { ...s, sold: soldSeats } : s))
      );
    },
    [setShows]
  );

  const mergeShowSold = useCallback(
    (showId, addedSeats) => {
      if (!Array.isArray(addedSeats) || !addedSeats.length) return;
      setShows((current) =>
        current.map((s) =>
          s.id === showId
            ? { ...s, sold: [...new Set([...(s.sold || []), ...addedSeats])] }
            : s
        )
      );
    },
    [setShows]
  );

  const releaseShowSold = useCallback(
    (showId, releasedSeats) => {
      if (!Array.isArray(releasedSeats) || !releasedSeats.length) return;
      setShows((current) =>
        current.map((s) =>
          s.id === showId
            ? { ...s, sold: (s.sold || []).filter((seat) => !releasedSeats.includes(seat)) }
            : s
        )
      );
    },
    [setShows]
  );

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
    setTickets([]);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setDataError("");
      try {
        const [moviesRes, roomsRes, showsRes] = await Promise.all([
          api.get("/movies"),
          api.get("/rooms"),
          api.get("/shows"),
        ]);
        const serverMovies = extractList(moviesRes);
        const serverRooms = extractList(roomsRes);
        const serverShows = extractList(showsRes);
        if (active) {
          if (serverMovies) setMovies(serverMovies);
          if (serverRooms) {
            setRooms(
              serverRooms.map((r) => ({
                ...r,
                vipRows: parseVipRows(r.vipRows),
              }))
            );
          }
          if (serverShows) setShows(serverShows);
        }
      } catch (error) {
        if (active) {
          setDataError("Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và tải lại trang.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [refreshKey, setMovies, setRooms, setShows]);

  const book = async (show, seats, couponCode = null) => {
    if (!getToken()) throw new Error("Vui lòng đăng nhập lại để đặt vé.");
    try {
      const { ticket } = await api.post("/tickets", {
        showId: show.id,
        seats,
        ...(couponCode ? { couponCode } : {}),
      });
      setTickets((current) => [ticket, ...current]);
      mergeShowSold(show.id, seats);
      return { ticket };
    } catch (error) {
      if (error.status === 409 && error.conflicts?.length) {
        mergeShowSold(show.id, error.conflicts);
        return { conflicts: error.conflicts };
      }
      throw error;
    }
  };

  const cancelTicket = async (id) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || showDate(ticket.show) - Date.now() < 7200000) return false;
    if (!getToken()) throw new Error("Vui lòng đăng nhập lại để hủy vé.");
    await api.patch(`/tickets/${encodeURIComponent(id)}/cancel`);
    setTickets((current) =>
      current.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
    );
    releaseShowSold(ticket.showId, ticket.seats || []);
    return true;
  };

  const value = {
    user,
    theme,
    toggleTheme,
    authenticate,
    logout,
    movies,
    setMovies,
    rooms,
    setRooms,
    shows,
    setShows,
    syncShowSold,
    mergeShowSold,
    releaseShowSold,
    tickets,
    book,
    cancelTicket,
    notice,
    notify,
  };

  return (
    <AppContext.Provider value={value}>
      {dataError && <div className="wrap notice notice-error" role="alert">{dataError}</div>}
      {ticketsError && <div className="wrap notice notice-error" role="alert">{ticketsError}</div>}
      {loading ? <div className="wrap page-shell" role="status">Đang tải dữ liệu...</div> : children}
      <div className="sr-only" role="status" aria-live="polite">
        {notice}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

export const useOccupied = (show) => {
  return useMemo(() => {
    if (!show) return [];

    const occupiedSeats = new Set(show.sold || []);
    return [...occupiedSeats];
  }, [show]);
};
