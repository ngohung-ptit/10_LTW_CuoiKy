import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context";
import { createAppStore, startBooking, toggleSeat } from "./store";
import { AuthPage } from "./pages/AuthPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { MoviesPage } from "./pages/MoviesPage";
import { TicketsPage } from "./pages/TicketsPage";
import { BookingPage } from "./booking";
import { AdminShows } from "./admin/AdminShows";
import { Header, Protected } from "./components";
import { useCountdown } from "./hooks";
import { days, initialShows, money } from "./data";
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from "./auth";

const member = { id: "demo-member", name: "Bạn yêu phim", role: "member" };
const futureShow = initialShows.find(
  (s) =>
    s.date === days[1] && s.movieId === "interstellar" && s.roomId === "room-1",
);
const mount = (route, user = member) => {
  if (user) localStorage.setItem("cinenep-user", JSON.stringify(user));
  const store = createAppStore();
  render(
    <Provider store={store}>
      <AppProvider initialUser={user}>
        <MemoryRouter
          initialEntries={[route]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/phim" element={<MoviesPage />} />
            <Route path="/phim/:movieId" element={<MovieDetailPage />} />
            <Route path="/dang-nhap" element={<AuthPage />} />
            <Route element={<Protected />}>
              <Route path="/dat-ve/:showId" element={<BookingPage />} />
              <Route path="/ve-cua-toi" element={<TicketsPage />} />
            </Route>
            <Route element={<Protected admin />}>
              <Route path="/quan-tri/suat-chieu" element={<AdminShows />} />
            </Route>
            <Route path="/" element={<p>Trang chủ</p>} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </Provider>,
  );
  return store;
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.scrollTo = jest.fn();
  delete global.fetch;
});

test("registration creates a member session without role-selection buttons", async () => {
  mount("/dang-nhap", null);
  expect(screen.queryByText(/Vào vai/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
  fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Sinh viên" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@udu.example" } });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Student@123" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Vé của tôi" })).toBeInTheDocument());
  const account = getCurrentUser();
  expect(account).toMatchObject({ email: "student@udu.example", role: "member" });
  expect(sessionStorage.getItem("udu-session")).toBe(account.id);
  expect(localStorage.getItem("udu-accounts")).not.toContain("Student@123");
});

test("login displays an error for an incorrect password without an API", async () => {
  mount("/dang-nhap", null);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "member@udu.example" } });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Wrong@123" } });
  fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không đúng."));
  expect(sessionStorage.getItem("udu-session")).toBeNull();
});

test("demo accounts sign in with distinct roles and logout clears the session", async () => {
  const admin = await loginAccount({ email: "admin@udu.example", password: "Admin@12345" });
  expect(admin.role).toBe("admin");
  expect(getCurrentUser()).toEqual(admin);
  logoutAccount();
  expect(getCurrentUser()).toBeNull();
  const account = await loginAccount({ email: "member@udu.example", password: "Member@12345" });
  expect(account.role).toBe("member");
});

test("registration rejects duplicate email and always creates a member", async () => {
  const fields = { name: "Sinh viên", email: "Student@udu.example", password: "Student@123", role: "admin" };
  const account = await registerAccount(fields);
  expect(account.role).toBe("member");
  logoutAccount();
  await expect(registerAccount({ ...fields, email: "student@udu.example" })).rejects.toThrow("Email này đã được đăng ký.");
  const returningUser = await loginAccount({ email: "STUDENT@udu.example", password: fields.password });
  expect(returningUser.id).toBe(account.id);
});

test("legacy browser role data cannot grant administrator access", () => {
  localStorage.setItem("cinenep-user", JSON.stringify({ id: "fake", role: "admin" }));
  mount("/quan-tri/suat-chieu", null);
  expect(screen.getByRole("heading", { name: "Hẹn gặp lại ở rạp." })).toBeInTheDocument();
});

test("mobile navigation closes when the current page is selected", () => {
  render(<AppProvider><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Header /></MemoryRouter></AppProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Mở menu" }));
  expect(screen.getByRole("navigation")).toHaveClass("is-open");
  fireEvent.click(screen.getByRole("link", { name: "Trang chủ" }));
  expect(screen.getByRole("navigation")).not.toHaveClass("is-open");
  expect(document.body.style.overflow).toBe("");
});

test("search supports Vietnamese names without accents and filters upcoming films", async () => {
  mount("/phim");
  fireEvent.change(screen.getByLabelText("Tìm phim theo tên"), {
    target: { value: "vung dat linh hon" },
  });
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
  expect(
    screen.getByRole("heading", { name: "Spirited Away" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Xóa tìm kiếm" }));
  fireEvent.click(screen.getByRole("button", { name: "Sắp chiếu" }));
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
  expect(
    screen.getByRole("heading", { name: "Inception" }),
  ).toBeInTheDocument();
});

test("guest is redirected to sign in before choosing seats", () => {
  mount(`/dat-ve/${futureShow.id}`, null);
  expect(
    screen.getByRole("heading", { name: "Hẹn gặp lại ở rạp." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Ghế A1/ }),
  ).not.toBeInTheDocument();
});

test("member cannot enter the admin route", () => {
  mount("/quan-tri/suat-chieu");
  expect(screen.getByText("Trang chủ")).toBeInTheDocument();
});

test("sold seats are disabled, eight-seat limit is enforced and mixed prices are calculated", () => {
  mount(`/dat-ve/${futureShow.id}`);
  expect(screen.getByRole("button", { name: "Ghế A3, đã bán" })).toBeDisabled();
  ["A1", "A2", "A5", "A6", "A7", "A8", "A9", "D1"].forEach((id) =>
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`Ghế ${id},`) }),
    ),
  );
  expect(document.querySelector(".summary-total strong")).toHaveTextContent(
    money(7 * 75000 + 95000).replace(/\s/g, " "),
  );
  fireEvent.click(screen.getByRole("button", { name: "Ghế D2, VIP" }));
  expect(screen.getByRole("alert")).toHaveTextContent("tối đa 8 ghế");
  expect(screen.getByRole("button", { name: "Ghế D2, VIP" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("booking saves a confirmed ticket, survives remount and can be cancelled", () => {
  const store = mount(`/dat-ve/${futureShow.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Ghế D1, VIP" }));
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận đặt vé" }));
  expect(
    screen.getByRole("heading", { name: "Vé của tôi" }),
  ).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem("cinenep-tickets"));
  expect(saved[0]).toMatchObject({
    seats: ["D1"],
    total: 95000,
    status: "confirmed",
    userId: member.id,
  });
  expect(store.getState().booking.selected).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Hủy vé" }));
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận hủy" }));
  expect(JSON.parse(localStorage.getItem("cinenep-tickets"))[0].status).toBe(
    "cancelled",
  );
});

test("confirmation detects a seat booked in another tab and removes the conflict", () => {
  mount(`/dat-ve/${futureShow.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Ghế A1, thường" }));
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
  localStorage.setItem(
    "cinenep-tickets",
    JSON.stringify([
      {
        id: "OTHER",
        showId: futureShow.id,
        status: "confirmed",
        seats: ["A1"],
        userId: "someone-else",
      },
    ]),
  );
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận đặt vé" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Ghế A1 vừa được đặt");
  expect(screen.getByRole("button", { name: "Ghế A1, đã bán" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
});

test("ticket cannot be cancelled less than two hours before screening", () => {
  const near = new Date(Date.now() + 3600000);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(near);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(near);
  localStorage.setItem(
    "cinenep-tickets",
    JSON.stringify([
      {
        id: "NEP-TEST",
        userId: member.id,
        movieId: "interstellar",
        seats: ["A1"],
        total: 75000,
        status: "confirmed",
        roomName: "Phòng 01",
        show: { date, time },
      },
    ]),
  );
  mount("/ve-cua-toi");
  expect(
    screen.queryByRole("button", { name: "Hủy vé" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/chỉ được hủy trước giờ chiếu/)).toBeInTheDocument();
});

test("admin is prevented from creating an overlapping show", () => {
  mount("/quan-tri/suat-chieu", { ...member, role: "admin" });
  fireEvent.click(screen.getByRole("button", { name: "Thêm suất chiếu" }));
  fireEvent.change(screen.getAllByLabelText("Ngày chiếu")[0], {
    target: { value: days[1] },
  });
  fireEvent.change(screen.getByLabelText("Giờ chiếu"), {
    target: { value: "10:30" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu suất chiếu" }));
  expect(screen.getByRole("alert")).toHaveTextContent("chồng giờ");
});

test("five-minute countdown uses an absolute deadline and cleans up interval", () => {
  jest.useFakeTimers();
  const onExpire = jest.fn();
  const deadline = Date.now() + 300000;
  const Clock = () => <span>{useCountdown(deadline, onExpire)}</span>;
  const { unmount } = render(<Clock />);
  expect(screen.getByText("05:00")).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(300000));
  expect(onExpire).toHaveBeenCalled();
  expect(screen.getByText("00:00")).toBeInTheDocument();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

test("expiry clears the selected seats and returns to the movie detail page", () => {
  jest.useFakeTimers();
  const store = mount(`/dat-ve/${futureShow.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Ghế A1, thường" }));
  act(() => jest.advanceTimersByTime(300000));
  expect(
    screen.getByRole("heading", { name: "Interstellar", level: 1 }),
  ).toBeInTheDocument();
  expect(store.getState().booking.selected).toEqual([]);
  expect(store.getState().booking.deadline).toBeNull();
  jest.useRealTimers();
});

test("redux retains the existing deadline when the same session is revisited", () => {
  const store = createAppStore();
  store.dispatch(startBooking("show-1"));
  const deadline = store.getState().booking.deadline;
  store.dispatch(toggleSeat("A1"));
  store.dispatch(startBooking("show-1"));
  expect(store.getState().booking).toMatchObject({
    deadline,
    selected: ["A1"],
  });
  store.dispatch(startBooking("show-2"));
  expect(store.getState().booking.selected).toEqual([]);
});
