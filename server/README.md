# Backend UDU cinematic — Đặt vé xem phim

## Công nghệ sử dụng
- Node.js & Express.js (ES6 Modules)
- SQLite & MySQL (chuyển đổi linh hoạt qua Sequelize ORM)
- JWT (JSON Web Token) & bcryptjs
- QRCode & Socket.io

## Cài đặt & Khởi chạy

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file cấu hình môi trường `.env`:
```bash
cp .env.example .env
```

3. Nạp dữ liệu mẫu ban đầu (Seed database):
```bash
npm run seed
```

4. Khởi động server (chạy ở cổng 5000):
```bash
npm start
# hoặc chế độ dev (nodemon tự tải lại khi sửa file)
npm run dev
```

5. Kiểm thử API tự động:
```bash
npm test
# hoặc node testApi.js
```

## Chuyển đổi sang MySQL (Nếu cần)

Dự án sử dụng Sequelize ORM nên đã hỗ trợ sẵn cả **SQLite** và **MySQL** mà không cần sửa code logic.

Để chuyển sang MySQL:
1. Mở MySQL (XAMPP, MySQL Workbench, Docker...) và tạo một database mới:
   ```sql
   CREATE DATABASE cinenep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Trong file `server/.env`, đổi cấu hình:
   ```env
   DB_DIALECT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=cinenep
   DB_USER=root
   DB_PASSWORD=mat_khau_cua_ban
   ```
3. Chạy lệnh seed để Sequelize tự động tạo bảng và nạp dữ liệu vào MySQL:
   ```bash
   npm run seed
   ```
4. Khởi động server: `npm start`.

## Danh sách RESTful API

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Khách | Đăng ký tài khoản (mặc định vai trò `member`) |
| `POST` | `/api/auth/login` | Công khai | Đăng nhập tài khoản, trả về JWT token |
| `GET` | `/api/auth/me` | Đã đăng nhập | Lấy thông tin tài khoản hiện tại |
| `GET` | `/api/movies` | Công khai | Lấy danh sách phim (hỗ trợ lọc `status`, `genre`, tìm `search`) |
| `GET` | `/api/movies/:id` | Công khai | Xem chi tiết phim |
| `POST` | `/api/movies` | Admin | Thêm phim mới |
| `PUT` | `/api/movies/:id` | Admin | Cập nhật thông tin phim |
| `DELETE` | `/api/movies/:id` | Admin | Xóa phim |
| `GET` | `/api/rooms` | Công khai | Lấy danh sách phòng chiếu và cấu hình hàng/cột/VIP |
| `POST` | `/api/rooms` | Admin | Thêm phòng chiếu mới |
| `PUT` | `/api/rooms/:id` | Admin | Cập nhật cấu hình phòng chiếu |
| `GET` | `/api/shows` | Công khai | Lấy danh sách suất chiếu kèm danh sách ghế đã bán |
| `GET` | `/api/shows/:id` | Công khai | Chi tiết suất chiếu |
| `POST` | `/api/shows` | Admin | Tạo suất chiếu (tự động kiểm tra chống trùng giờ trong cùng phòng) |
| `DELETE` | `/api/shows/:id` | Admin | Xóa suất chiếu chưa có vé đặt |
| `POST` | `/api/tickets` | Member | Đặt vé xem phim (SQL Transaction chống đặt trùng ghế, trả về 409 Conflict) |
| `GET` | `/api/tickets/my-tickets` | Member | Lấy danh sách vé đã đặt của người dùng |
| `PATCH` | `/api/tickets/:id/cancel` | Member | Hủy vé (kiểm tra trước giờ chiếu 2 tiếng, hoàn trả ghế trống) |
| `GET` | `/api/analytics/dashboard` | Admin | Thống kê tổng quan rạp (doanh thu, số vé, số ghế, suất chiếu) |
| `GET` | `/api/analytics/by-movie` | Admin | Thống kê doanh thu theo từng bộ phim (`GROUP BY`) |
| `GET` | `/api/analytics/by-date` | Admin | Thống kê doanh thu theo ngày chiếu (`GROUP BY`) |

## Danh sách tài khoản mẫu
- Quản trị viên: `admin@udu.example` / `Admin@12345`
- Thành viên: `member@udu.example` / `Member@12345`
