import { configureStore, createSlice } from "@reduxjs/toolkit";

const bookingSlice = createSlice({
  name: "booking",
  initialState: { showId: null, selected: [], deadline: null },
  reducers: {
    startBooking: (state, { payload }) => {
      if (state.showId !== payload || state.deadline <= Date.now()) {
        state.showId = payload;
        state.selected = [];
        state.deadline = Date.now() + 300000;
      }
    },
    toggleSeat: (state, { payload }) => {
      const seatId = payload;
      const isSelected = state.selected.includes(seatId);

      // Bấm lại ghế đã chọn thì bỏ chọn ghế đó.
      if (isSelected) {
        state.selected = state.selected.filter((id) => id !== seatId);
        return;
      }

      // Chỉ thêm ghế khi chưa vượt giới hạn của đề bài.
      if (state.selected.length < 8) {
        state.selected = [...state.selected, seatId];
      }
    },
    clearBooking: (state) => {
      state.showId = null;
      state.selected = [];
      state.deadline = null;
    },
    removeSeats: (state, { payload }) => {
      state.selected = state.selected.filter((id) => !payload.includes(id));
    },
  },
});
export const { startBooking, toggleSeat, clearBooking, removeSeats } =
  bookingSlice.actions;
export const createAppStore = () =>
  configureStore({ reducer: { booking: bookingSlice.reducer } });
export const store = createAppStore();
