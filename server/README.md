# Backend UDU cinematic — Đặt vé xem phim

## Công nghệ sử dụng
- Node.js & Express.js (ES6 Modules)
- **MongoDB & Mongoose ODM** (6 collections có liên kết tham chiếu `_id` và document lồng nhau)
- JWT (JSON Web Token) & `bcryptjs`
- `qrcode` & `socket.io`
- `mongodb-memory-server` (kiểm thử cô lập)

## Cài đặt & Khởi chạy

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file cấu hình môi trường `.env`:
```bash
cp .env.example .env
```

3. Cấu hình chuỗi kết nối MongoDB và tên database trong `server/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/udu_cinematic
DB_NAME=udu_cinematic
```
> Nếu triển khai với **MongoDB Atlas**, điền chuỗi `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority` vào `MONGODB_URI` và đặt tên database mong muốn ở biến `DB_NAME` (mặc định `udu_cinematic`, không bị rơi về database `test`).

4. Nạp dữ liệu mẫu ban đầu (Seed database):
```bash
npm run seed
```

5. Khởi động server (chạy ở cổng 5000):
```bash
npm start
# hoặc chế độ dev (nodemon tự tải lại khi sửa file)
npm run dev
```

6. Kiểm thử tự động REST API (tự dùng `MongoMemoryServer` cô lập):
```bash
npm test
# hoặc từ thư mục gốc: npm run test:server
```

## Thiết kế Collection MongoDB (6 Collections)

| Collection | Mô tả | Liên kết & Tối ưu |
| :--- | :--- | :--- |
| `users` | Tài khoản người dùng (`_id`: `udu-admin`, `udu-member`, ...) | `email` unique index, mật khẩu băm `bcryptjs` |
| `movies` | Danh mục phim (`_id`: `interstellar`, `dune`, ...) | Index `{ status: 1, createdAt: -1 }`, `genre`, hỗ trợ poster Base64 |
| `rooms` | Phòng chiếu (`_id`: `room-1`, `room-2`, ...) | Nhúng mảng `vipRows` (`["D", "E", "F"]`) trực tiếp trong document |
| `shows` | Suất chiếu (`_id`: `{date}-{movieId}-{roomSuffix}`) | Tham chiếu `movieId -> movies._id`, `roomId -> rooms._id`, index `{ roomId, date, time }` |
| `tickets` | Vé đã đặt (`_id`: `UDU-XXXXXXXX`) | Tham chiếu `userId`, `showId`, `movieId`, `couponCode`; nhúng mảng `seats: [{ seatId, price }]`; **Partial Unique Index** `{ showId: 1, "seats.seatId": 1 }` khi `status: "confirmed"` |
| `coupons` | Mã giảm giá (`_id` & `code`: `UDU10`, `VIP20`) | Kiểm tra và tính giảm giá ở server khi đặt vé |

## Danh sách RESTful API

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Khách | Đăng ký tài khoản (mặc định vai trò `member`, validate đầu vào) |
| `POST` | `/api/auth/login` | Công khai | Đăng nhập tài khoản, trả về JWT token (`7d`) |
| `GET` | `/api/auth/me` | Đã đăng nhập | Lấy thông tin tài khoản hiện tại |
| `GET` | `/api/movies` | Công khai | Danh sách phim; hỗ trợ lọc `status`, `genre` (`$in`), `search` (`$regex`), `minDuration`/`maxDuration` (`$gte`/`$lte`), phân trang `page` & `limit` |
| `GET` | `/api/movies/:id` | Công khai | Xem chi tiết phim kèm danh sách suất chiếu |
| `POST` | `/api/movies` | Admin | Thêm phim mới (sinh slug `_id`, bắt trùng `409`) |
| `PUT` | `/api/movies/:id` | Admin | Cập nhật thông tin phim |
| `DELETE` | `/api/movies/:id` | Admin | Xóa phim chưa có suất chiếu |
| `GET` | `/api/rooms` | Công khai | Lấy danh sách phòng chiếu và cấu hình hàng/cột/VIP |
| `GET` | `/api/rooms/:id` | Công khai | Lấy chi tiết phòng chiếu |
| `POST` | `/api/rooms` | Admin | Thêm phòng chiếu mới |
| `PUT` | `/api/rooms/:id` | Admin | Cập nhật cấu hình phòng chiếu |
| `DELETE` | `/api/rooms/:id` | Admin | Xóa phòng chưa có suất chiếu |
| `GET` | `/api/shows` | Công khai | Lấy danh sách suất chiếu (lọc `date`, `fromDate` `$gte`, `movieId`, `roomId`, phân trang `page` & `limit`) kèm `sold` |
| `GET` | `/api/shows/:id` | Công khai | Chi tiết suất chiếu và danh sách ghế đã bán |
| `POST` | `/api/shows` | Admin | Tạo suất chiếu (tự động kiểm tra chống chồng giờ trong cùng phòng `400`) |
| `PUT` | `/api/shows/:id` | Admin | Sửa suất chưa có vé, kiểm tra lại chồng giờ |
| `DELETE` | `/api/shows/:id` | Admin | Xóa suất chiếu chưa có vé đặt |
| `POST` | `/api/tickets` | Member | Đặt vé xem phim (hỗ trợ `couponCode`, sinh QR, Partial Unique Index chống trùng ghế `409 Conflict`) |
| `GET` | `/api/tickets/my-tickets` | Member | Lấy danh sách vé đã đặt của người dùng (hỗ trợ `status`, `page`, `limit`) |
| `PATCH` | `/api/tickets/:id/cancel` | Member | Hủy vé (kiểm tra sở hữu `403`, trước giờ chiếu 2 tiếng `400`, tự động giải phóng ghế) |
| `GET` | `/api/coupons` | Công khai | Danh sách mã giảm giá đang hoạt động |
| `POST` | `/api/coupons/verify` | Công khai | Kiểm tra tính hợp lệ của mã giảm giá |
| `POST` | `/api/coupons` | Admin | Tạo mã giảm giá mới |
| `GET` | `/api/analytics/dashboard` | Admin | Thống kê tổng quan rạp (Aggregation Pipeline: doanh thu, số vé, số ghế, suất sắp tới) |
| `GET` | `/api/analytics/by-movie` | Admin | Thống kê doanh thu theo từng bộ phim (Aggregation Pipeline `$lookup` + `$group`) |
| `GET` | `/api/analytics/by-date` | Admin | Thống kê doanh thu theo ngày chiếu (Aggregation Pipeline `$group` + `$sort`) |

## Danh sách tài khoản mẫu
- Quản trị viên: `admin@udu.example` / `Admin@12345`
- Thành viên: `member@udu.example` / `Member@12345`

## Đồng bộ quản trị phòng, suất chiếu và kiểm thử

Frontend gọi POST/PUT/DELETE đến backend khi thêm/sửa/xóa phim, phòng và suất. Danh sách chỉ cập nhật sau khi API ghi MongoDB thành công; nếu mất kết nối hoặc bị từ chối, giữ nguyên danh sách và hiển thị lỗi.

Không đổi sơ đồ ghế hoặc xóa phòng khi phòng còn suất chiếu. Suất đã có vé (kể cả vé đã hủy) không được sửa/xóa để giữ lịch sử; vẫn có thể sửa/xóa suất chưa có vé. Server kiểm tra cấu hình hàng/cột/VIP, giá vé, thời gian tương lai và chồng giờ khi tạo lẫn sửa suất.

Lưu ý: Nguồn dữ liệu mẫu gốc (phim, phòng, khung giờ chiếu, mã giảm giá) được quản lý tập trung tại `server/src/seed/seedData.json` và tự động đồng bộ sang `client/src/seedData.json` qua `client/scripts/sync-seed.cjs` khi chạy `npm run seed`, `npm start` hoặc `npm run build`. Script `npm run seed` sẽ gọi `deleteMany({})` trên các collection và `syncIndexes()`, sau đó nạp lại toàn bộ dữ liệu mẫu ban đầu.
