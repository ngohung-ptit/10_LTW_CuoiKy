import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminRooms } from "./AdminRooms";
import { AdminShows } from "./AdminShows";
import { api } from "../api";
import { useApp } from "../context";
import { days } from "../data";

jest.mock("../api", () => ({ api: { post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock("../context", () => ({ useApp: jest.fn() }));
const room = { id: "room-id", name: "Phòng thử", rows: 6, columns: 8, vipRows: ["D"] };
const show = { id: "show-id", movieId: "movie-id", roomId: room.id, date: days[1], time: "10:00", price: 75000, vipPrice: 95000, sold: [] };
const setRooms = jest.fn();
const setShows = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  useApp.mockReturnValue({ rooms: [room], shows: [], movies: [{ id: "movie-id", title: "Test", duration: 120 }], tickets: [], setRooms, setShows });
});

const cases = [
  { name: "room", Component: AdminRooms, endpoint: "/rooms", saved: room, setter: setRooms,
    add: "Thêm phòng", save: "Lưu phòng", fill: () => fireEvent.change(screen.getByLabelText("Tên phòng"), { target: { value: "Phòng mới" } }) },
  { name: "show", Component: AdminShows, endpoint: "/shows", saved: show, setter: setShows,
    add: "Thêm suất chiếu", save: "Lưu suất chiếu", fill: () => fireEvent.change(screen.getAllByLabelText("Ngày chiếu")[0], { target: { value: days[1] } }) },
];

test.each(cases)("$name creation waits for database confirmation", async ({ Component, endpoint, saved, setter, add, save, fill }) => {
  let confirm;
  api.post.mockImplementation(() => new Promise((resolve) => { confirm = resolve; }));
  render(<Component />);
  fireEvent.click(screen.getByRole("button", { name: add }));
  fill();
  fireEvent.click(screen.getByRole("button", { name: save }));
  expect(api.post).toHaveBeenCalledWith(endpoint, expect.any(Object));
  expect(setter).not.toHaveBeenCalled();
  confirm(saved);
  await waitFor(() => expect(setter).toHaveBeenCalledTimes(1));
  expect(setter.mock.calls[0][0]([])).toEqual([saved]);
});

test.each(cases)("$name failed save preserves the form and list", async ({ Component, setter, add, save, fill }) => {
  api.post.mockRejectedValue(Object.assign(new Error("Database unavailable"), { status: 500 }));
  render(<Component />);
  fireEvent.click(screen.getByRole("button", { name: add }));
  fill();
  fireEvent.click(screen.getByRole("button", { name: save }));
  await screen.findByText("Database unavailable");
  expect(setter).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: save })).toBeEnabled();
});

test.each(cases)("$name edit and delete use API and preserve the list on rejection", async ({ name, Component, endpoint, saved, setter, save }) => {
  if (name === "show") useApp.mockReturnValue({ ...useApp(), shows: [show] });
  render(<Component />);
  if (name === "show") fireEvent.change(screen.getByLabelText("Ngày chiếu"), { target: { value: days[1] } });
  fireEvent.click(screen.getByRole("button", { name: name === "room" ? "Sửa phòng" : "Sửa suất 10:00" }));
  api.put.mockResolvedValue(saved);
  fireEvent.click(screen.getByRole("button", { name: save }));
  await waitFor(() => expect(setter).toHaveBeenCalledTimes(1));
  expect(api.put).toHaveBeenCalledWith(`${endpoint}/${saved.id}`, expect.any(Object));
  setter.mockClear();
  api.delete.mockRejectedValue(Object.assign(new Error("Không thể xóa"), { status: 400 }));
  const clickDelete = () => {
    fireEvent.click(screen.getByRole("button", { name: name === "room" ? "Xóa phòng" : "Xóa suất 10:00" }));
    if (name === "show") fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
  };
  clickDelete();
  await screen.findByText("Không thể xóa");
  expect(setter).not.toHaveBeenCalled();
  api.delete.mockResolvedValue({ message: "OK" });
  if (name === "show") fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
  else clickDelete();
  await waitFor(() => expect(setter).toHaveBeenCalledTimes(1));
  expect(api.delete).toHaveBeenLastCalledWith(`${endpoint}/${saved.id}`);
  expect(setter.mock.calls[0][0]([saved])).toEqual([]);
});
