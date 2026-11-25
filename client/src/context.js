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
  initialRooms,
  initialShows,
  movies as initialMovies,
  parseVipRows,
  showDate,
} from "./data";

const AppContext = createContext(null);
const isTestEnv = () => process.env.NODE_ENV === "test";
const extractList = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : null;

export const AppProvider = ({ children, initialUser = null, refreshKey }) => {
  const [user, setUser] = useState(() => initialUser || getCurrentUser());
  const [theme, setTheme] = useLocalStorage("udu-theme", "light");
  const [movies, setMovies] = useLocalStorage("cinenep-movies", initialMovies);
  const [rooms, setRooms] = useLocalStorage("cinenep-rooms", initialRooms);
  const [shows, setShows] = useLocalStorage("cinenep-shows-v1", initialShows);
  const [tickets, setTickets] = useLocalStorage("cinenep-tickets", []);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const notify = useCallback((message) => setNotice(message), []);

  const refreshMyTickets = useCallback(async () => {
    if (!getToken()) return;
    try {
      const serverTickets = extractList(await api.get("/tickets/my-tickets"));
      if (serverTickets) {
        setTickets(serverTickets);
      }
    } catch {
      // Retain existing state if request fails transiently
    }
  }, [setTickets]);

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
    await refreshMyTickets();
    return account;
  };

  const logout = () => {
    const hadApiToken = Boolean(getToken());
    logoutAccount();
    setUser(null);
    if (hadApiToken) {
      setTickets([]);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
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
        if (active && getToken()) {
          await refreshMyTickets();
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
  }, [refreshKey, setMovies, setRooms, setShows, refreshMyTickets]);

  const book = (show, seats, total, couponCode = null) => {
    if (getToken() || !isTestEnv()) {
      return (async () => {
        if (!getToken()) {
          throw new Error("Vui lòng đăng nhập lại để đặt vé.");
        }
        try {
          const data = await api.post("/tickets", {
            showId: show.id,
            seats,
            ...(couponCode ? { couponCode } : {}),
          });
          const createdTicket = data.ticket;
          setTickets((current) => [createdTicket, ...current]);
          mergeShowSold(show.id, seats);
          return { ticket: createdTicket };
        } catch (err) {
          if (err.status === 409) {
            const conflicts = err.conflicts || [];
            if (conflicts.length) {
              mergeShowSold(show.id, conflicts);
            }
            return { conflicts };
          }
          throw err;
        }
      })();
    }

    let latest = tickets;
    try {
      latest = JSON.parse(localStorage.getItem("cinenep-tickets") || "[]");
    } catch {}

    const occupied = [...(show.sold || [])];
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
      couponCode: couponCode || null,
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
      (ticket.userId !== user?.id && user?.role !== "admin") ||
      showDate(ticket.show) - Date.now() < 7200000
    ) {
      return false;
    }

    if (getToken() || !isTestEnv()) {
      return (async () => {
        if (!getToken()) {
          throw new Error("Vui lòng đăng nhập lại để hủy vé.");
        }
        await api.patch(`/tickets/${encodeURIComponent(id)}/cancel`);
        setTickets((current) =>
          current.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
        );
        releaseShowSold(ticket.showId, Array.isArray(ticket.seats) ? ticket.seats : []);
        return true;
      })();
    }

    setTickets((current) =>
      current.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
    );
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

    const occupiedSeats = new Set(show.sold || []);
    if (!getToken()) {
      for (const ticket of tickets) {
        if (ticket.showId === show.id && ticket.status === "confirmed") {
          for (const seat of ticket.seats || []) {
            occupiedSeats.add(seat);
          }
        }
      }
    }
    return [...occupiedSeats];
  }, [show, tickets]);
};
