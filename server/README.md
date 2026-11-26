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
| `users` | Tài khoản người dùng (`_id`: `udu-admin`, `udu-member`, ...) | `email` unique index, mật khẩu băm `bcryptjs`, tự động ẩn `password` khi trả JSON |
| `movies` | Danh mục phim (`_id`: `hexed`, `dark-knight`, `parasite`, `oppenheimer`, ...) | Index `{ status: 1, createdAt: -1 }`, `genre`, hỗ trợ poster tĩnh hoặc ảnh JPG Base64 |
| `rooms` | Phòng chiếu (`_id`: `room-1` .. `room-7`, ...) | Nhúng mảng `vipRows` (`["D", "E", "F"]`) trực tiếp trong document |
| `shows` | Suất chiếu (`_id`: `{date}-{movieId}-{roomSuffix}[-{HHmm}]`) | Tham chiếu `movieId -> movies._id`, `roomId -> rooms._id`, index `{ roomId, date, time }` |
| `tickets` | Vé đã đặt (`_id`: `UDU-XXXXXXXX`) | Tham chiếu `userId`, `showId`, `movieId`, `couponCode`; nhúng mảng `seats: [{ seatId, price }]`; **Partial Unique Index** `{ showId: 1, "seats.seatId": 1 }` khi `status: "confirmed"` |
| `coupons` | Mã giảm giá (`_id` & `code`: `UDU10`, `VIP20`) | Kiểm tra hiệu lực và tính mức giảm giá có trần `maxDiscount` ở server |

## Danh sách RESTful API

| Method | Endpoint | Quyền hạn | Mã HTTP chính | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Khách | `201`, `400` | Đăng ký tài khoản (mặc định vai trò `member`, validate đầu vào, băm mật khẩu) |
| `POST` | `/api/auth/login` | Công khai | `200`, `400`, `401` | Đăng nhập tài khoản, trả về JWT token có thời hạn (`7d`) |
| `GET` | `/api/auth/me` | Đã đăng nhập | `200`, `401`, `404` | Lấy thông tin tài khoản hiện tại từ JWT |
| `GET` | `/api/movies` | Công khai | `200` | Danh sách phim; hỗ trợ lọc `status`, `genre` (`$in`), `search` (`$regex`), `minDuration`/`maxDuration` (`$gte`/`$lte`), `yearFrom` (`$gte`), phân trang `page` & `limit` |
| `GET` | `/api/movies/:id` | Công khai | `200`, `404` | Xem chi tiết phim kèm danh sách suất chiếu (`populate`) |
| `POST` | `/api/movies` | Admin | `201`, `400`, `401`, `403`, `409` | Thêm phim mới (sinh slug `_id`, bắt trùng mã phim `409`) |
| `PUT` | `/api/movies/:id` | Admin | `200`, `400`, `401`, `403`, `404` | Cập nhật thông tin phim |
| `DELETE` | `/api/movies/:id` | Admin | `200`, `400`, `401`, `403`, `404` | Xóa phim chưa có suất chiếu |
| `GET` | `/api/rooms` | Công khai | `200` | Lấy danh sách phòng chiếu và cấu hình hàng/cột/hàng VIP |
| `GET` | `/api/rooms/:id` | Công khai | `200`, `404` | Lấy chi tiết phòng chiếu |
| `POST` | `/api/rooms` | Admin | `201`, `400`, `401`, `403`, `409` | Thêm phòng chiếu mới (kiểm tra trùng tên phòng `409`) |
| `PUT` | `/api/rooms/:id` | Admin | `200`, `400`, `401`, `403`, `404`, `409` | Cập nhật cấu hình phòng chiếu (chặn đổi sơ đồ khi phòng đã có suất chiếu) |
| `DELETE` | `/api/rooms/:id` | Admin | `200`, `400`, `401`, `403`, `404` | Xóa phòng chưa có suất chiếu |
| `GET` | `/api/shows` | Công khai | `200` | Lấy danh sách suất chiếu (lọc `date`, `fromDate` `$gte`, `movieId`, `roomId`, phân trang `page` & `limit`) kèm mảng ghế `sold` |
| `GET` | `/api/shows/:id` | Công khai | `200`, `404` | Chi tiết suất chiếu và danh sách ghế đã bán |
| `POST` | `/api/shows` | Admin | `201`, `400`, `401`, `403` | Tạo suất chiếu (tự động kiểm tra chống chồng giờ trong cùng phòng `400`) |
| `PUT` | `/api/shows/:id` | Admin | `200`, `400`, `401`, `403`, `404` | Sửa suất chưa có vé, kiểm tra lại chồng giờ |
| `DELETE` | `/api/shows/:id` | Admin | `200`, `400`, `401`, `403`, `404` | Xóa suất chiếu chưa có vé đặt |
| `POST` | `/api/tickets` | Đã đăng nhập | `201`, `400`, `401`, `404`, `409` | Đặt vé xem phim (tối đa 8 ghế, áp dụng `couponCode`, sinh QR, chống đặt trùng ghế `409 Conflict` kèm `conflicts`) |
| `GET` | `/api/tickets/my-tickets` | Đã đăng nhập | `200`, `401` | Lấy lịch sử vé của người dùng hiện tại (hỗ trợ lọc `status`, phân trang `page`, `limit`) |
| `PATCH` | `/api/tickets/:id/cancel` | Chủ vé / Admin | `200`, `400`, `401`, `403`, `404` | Hủy vé (kiểm tra quyền sở hữu `403`, trước giờ chiếu ít nhất 2 tiếng `400`, tự động giải phóng ghế) |
| `GET` | `/api/coupons` | Công khai | `200` | Danh sách mã giảm giá đang hoạt động |
| `POST` | `/api/coupons/verify` | Công khai | `200`, `400` | Kiểm tra tính hợp lệ của mã giảm giá |
| `POST` | `/api/coupons` | Admin | `201`, `400`, `401`, `403`, `409` | Tạo mã giảm giá mới |
| `GET` | `/api/analytics/dashboard` | Admin | `200`, `401`, `403` | Thống kê tổng quan rạp (Aggregation Pipeline `$lookup` + `$group`: doanh thu, số vé, số ghế, suất sắp tới) |
| `GET` | `/api/analytics/by-movie` | Admin | `200`, `401`, `403` | Thống kê doanh thu theo từng bộ phim (Aggregation Pipeline `$lookup` + `$project` + `$sort`, hỗ trợ lọc `?date=`) |
| `GET` | `/api/analytics/by-date` | Admin | `200`, `401`, `403` | Thống kê doanh thu theo ngày chiếu (Aggregation Pipeline `$lookup` + `$group` + `$sort`) |

## Sự kiện Realtime (Socket.IO)
- `seatsBooked`: Phát tới các client đang mở sơ đồ ghế khi có vé đặt thành công (`{ showId, seats }`).
- `seatsReleased`: Phát tới các client khi có vé được hủy hợp lệ để mở khóa lại ghế ngay lập tức (`{ showId, seats }`).

## Tài khoản & Mã giảm giá mẫu (Sau khi chạy Seed)
- **Quản trị viên (Admin):** `admin@udu.example` / `Admin@12345`
- **Thành viên (Member):** `member@udu.example` / `Member@12345`
- **Mã giảm giá:** `UDU10` (giảm 10%, tối đa 30.000đ) · `VIP20` (giảm 20%, tối đa 50.000đ)

## Đồng bộ quản trị phòng, suất chiếu và kiểm thử

Frontend gọi POST/PUT/DELETE đến backend khi thêm/sửa/xóa phim, phòng và suất. Danh sách chỉ cập nhật sau khi API ghi MongoDB thành công; nếu mất kết nối hoặc bị từ chối, giữ nguyên danh sách và hiển thị lỗi.

Không đổi sơ đồ ghế hoặc xóa phòng khi phòng còn suất chiếu. Suất đã có vé (kể cả vé đã hủy) không được sửa/xóa để giữ lịch sử; vẫn có thể sửa/xóa suất chưa có vé. Server kiểm tra cấu hình hàng/cột/VIP, giá vé, thời gian tương lai và chồng giờ khi tạo lẫn sửa suất.

Lưu ý: Nguồn dữ liệu mẫu gốc (phim, phòng, khung giờ chiếu, mã giảm giá) được quản lý tập trung tại `server/src/seed/seedData.json` và tự động đồng bộ sang `client/src/seedData.json` qua `client/scripts/sync-seed.cjs` khi chạy `npm run seed`, `npm start` hoặc `npm run build`. Script `npm run seed` sẽ gọi `deleteMany({})` trên các collection và `syncIndexes()`, sau đó nạp lại toàn bộ dữ liệu mẫu ban đầu.
