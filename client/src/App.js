import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { AppProvider } from "./context";
import { Layout, Protected } from "./components";
import { AuthPage } from "./pages/AuthPage";
import { GuidePage } from "./pages/GuidePage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { MoviesPage } from "./pages/MoviesPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SchedulePage } from "./pages/SchedulePage";
import { TicketsPage } from "./pages/TicketsPage";
import { BookingPage } from "./booking";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminLayout } from "./admin";
import { AdminMovies } from "./admin/AdminMovies";
import { AdminRooms } from "./admin/AdminRooms";
import { AdminShows } from "./admin/AdminShows";
import "./App.css";
import "./responsive.css";

const App = () => (
  <Provider store={store}>
    <AppProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="index.html" element={<HomePage />} />
            <Route path="phim" element={<MoviesPage />} />
            <Route path="phim/:movieId" element={<MovieDetailPage />} />
            <Route path="lich-chieu" element={<SchedulePage />} />
            <Route path="dang-nhap" element={<AuthPage />} />
            <Route path="huong-dan" element={<GuidePage />} />
            <Route element={<Protected />}>
              <Route path="dat-ve/:showId" element={<BookingPage />} />
              <Route path="ve-cua-toi" element={<TicketsPage />} />
            </Route>
            <Route element={<Protected admin />}>
              <Route path="quan-tri" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="phim" element={<AdminMovies />} />
                <Route path="phong" element={<AdminRooms />} />
                <Route path="suat-chieu" element={<AdminShows />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </Provider>
);
export default App;
