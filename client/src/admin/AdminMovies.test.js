import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminMovies } from "./AdminMovies";
import { api } from "../api";
import { useApp } from "../context";

jest.mock("../api", () => ({ api: { post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock("../context", () => ({ useApp: jest.fn() }));

const setMovies = jest.fn();
const fillForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "Thêm phim" }));
  fireEvent.change(screen.getByLabelText("Tên phim"), { target: { value: "New movie" } });
  fireEvent.change(screen.getByLabelText("Đạo diễn"), { target: { value: "Director" } });
  fireEvent.change(screen.getByLabelText("Nội dung phim"), { target: { value: "Description" } });
};

beforeEach(() => {
  jest.clearAllMocks();
  useApp.mockReturnValue({ movies: [], shows: [], setMovies });
});

test("only updates the list after the backend confirms creation", async () => {
  let confirm;
  api.post.mockImplementation(() => new Promise((resolve) => { confirm = resolve; }));
  render(<AdminMovies />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Lưu phim" }));
  expect(api.post).toHaveBeenCalledWith("/movies", expect.objectContaining({ title: "New movie" }));
  expect(api.post.mock.calls[0][1]).not.toHaveProperty("id");
  expect(setMovies).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  const saved = { id: "server-id", title: "New movie" };
  confirm(saved);
  await waitFor(() => expect(setMovies).toHaveBeenCalledTimes(1));
  expect(setMovies.mock.calls[0][0]([])).toEqual([saved]);
  expect(screen.queryByRole("button", { name: "Lưu phim" })).not.toBeInTheDocument();
});

test("keeps the form and list intact when database save fails", async () => {
  api.post.mockRejectedValue(Object.assign(new Error("Database unavailable"), { status: 500 }));
  render(<AdminMovies />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Lưu phim" }));
  await screen.findByText("Database unavailable");
  expect(setMovies).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Tên phim")).toHaveValue("New movie");
  expect(screen.getByRole("button", { name: "Lưu phim" })).toBeEnabled();
});
