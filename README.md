# UDU cinematic

Hệ thống web full-stack đặt vé xem phim trực tuyến: Khách xem lịch chiếu, thành viên chọn suất và ghế trên sơ đồ tương tác để đặt vé, quản trị viên quản lý phim, phòng chiếu, suất chiếu và theo dõi thống kê doanh thu.

---

Dữ liệu tài khoản, phim, phòng, suất chiếu, vé và thống kê được lấy từ API. Frontend chỉ xác nhận đặt/hủy vé sau khi server xử lý thành công; mất kết nối sẽ hiển thị lỗi. `localStorage` chỉ lưu lựa chọn sáng/tối (`udu-theme`); JWT và thông tin phiên đăng nhập lưu trong `sessionStorage`. Dữ liệu tài khoản/vé cục bộ của phiên bản cũ không còn được sử dụng và không tự chuyển vào database. Mã QR, mã giảm giá và cập nhật ghế qua Socket.IO/polling vẫn được giữ lại.

## Cấu trúc thư mục

```text
10_LTW_CuoiKy/
├── client/                  Toàn bộ frontend (React, Redux Toolkit, React Router)
│   ├── public/              Ảnh poster, font, tài nguyên tĩnh
│   ├── scripts/             Tiện ích preview bản build và đồng bộ seedData.json sang client
│   ├── src/
│   │   ├── admin/           Giao diện quản trị (dashboard Aggregation, phim, phòng, suất chiếu)
│   │   ├── pages/           Trang chủ, danh sách phim, chi tiết phim, lịch chiếu, vé của tôi, 404
│   │   ├── admin.js         Khung bố cục khu vực quản trị (AdminLayout + nested Outlet)
│   │   ├── api.js           Module gọi REST API tập trung, tự động gắn JWT
│   │   ├── App.js           Khai báo router, nested routes & route bảo vệ
│   │   ├── auth.js          Quản lý tài khoản, phiên đăng nhập JWT
│   │   ├── booking.js       Sơ đồ ghế động, tính tiền useMemo, mã giảm giá, đếm ngược 5 phút
│   │   ├── components.js    Các components tái sử dụng (Header, Footer, Button, Field,...)
│   │   ├── context.js       Context API dữ liệu dùng chung, theme sáng/tối & đồng bộ API
│   │   ├── data.js          Hàm tiện ích định dạng ngày giờ, tiền tệ, parseVipRows và cấu hình lịch
│   │   ├── hooks.js         Custom hooks (useLocalStorage, useDebounce, useCountdown)
│   │   ├── posters.js       Chuẩn hóa đường dẫn poster, srcSet responsive & kiểm tra ảnh JPG upload
│   │   ├── responsive.css   Responsive cho tablet và điện thoại di động
│   │   ├── seedData.json    Bản sao cấu hình seed được đồng bộ tự động từ server
│   │   └── store.js         Redux Toolkit quản lý ghế đang chọn & phiên đặt vé
│   └── package.json
├── server/                  Toàn bộ backend (Node.js, Express, MongoDB, Mongoose)
│   ├── src/
│   │   ├── config/          Kết nối CSDL MongoDB qua Mongoose & nạp biến môi trường (.env)
│   │   ├── controllers/     Xử lý logic nghiệp vụ, Aggregation Pipeline, phân trang & lọc
│   │   ├── middlewares/     Xác thực JWT, phân quyền Admin, xử lý lỗi tập trung
│   │   ├── models/          6 Mongoose Schemas (User, Movie, Room, Show, Ticket, Coupon)
│   │   ├── routes/          Định tuyến REST API tách theo tài nguyên
│   │   ├── utils/           Tiện ích sinh ID dễ nhớ & phân trang/datetime
│   │   ├── seed/            Nguồn dữ liệu mẫu gốc (seedData.json) và script nạp MongoDB (seedData.js)
│   │   └── app.js           Khởi tạo Express app, CORS, JSON parser, routes & error handler
│   ├── server.js            Entry point khởi động HTTP server + Socket.IO
│   ├── testApi.js           Kịch bản kiểm thử tự động toàn bộ REST API
│   ├── README.md            Tài liệu chi tiết kiến trúc CSDL và danh sách API backend
│   ├── .env.example         Mẫu biến môi trường
│   └── package.json
└── package.json             Lệnh điều khiển toàn bộ dự án từ thư mục gốc
```

---

## Hướng dẫn cài đặt & Khởi chạy

Yêu cầu môi trường: **Node.js 20+**, **npm** và **MongoDB** (cục bộ `mongodb://127.0.0.1:27017/udu_cinematic` hoặc **MongoDB Atlas**).

### 1. Cấu hình & Chạy Backend

Mở terminal tại thư mục gốc:

```bash
# Cài đặt thư viện backend
npm --prefix server install

# Tạo file biến môi trường nếu chưa có và cấu hình MONGODB_URI
cp server/.env.example server/.env

# Nạp dữ liệu mẫu (phim, phòng, suất chiếu, mã giảm giá, tài khoản demo) và đồng bộ sang client
npm run seed

# Khởi động backend (mặc định cổng 5000, hoặc dùng npm run server:dev để tự reload)
npm run server
```

> **Ghi chú CSDL:** Hệ thống sử dụng **MongoDB** qua **Mongoose ODM**. Bạn có thể dùng MongoDB Community cục bộ (`MONGODB_URI=mongodb://127.0.0.1:27017/udu_cinematic`) hoặc chuỗi kết nối **MongoDB Atlas** (`mongodb+srv://...`) kèm biến `DB_NAME=udu_cinematic` trong `server/.env` (tránh trường hợp chuỗi Atlas kết thúc bằng `/` làm MongoDB mặc định tạo database tên `test`). Xem tài liệu API và thiết kế CSDL chi tiết trong [server/README.md](server/README.md).

### 2. Chạy Frontend

Mở một terminal khác tại thư mục gốc:

```bash
# Cài đặt thư viện frontend
npm --prefix client install --legacy-peer-deps

# Khởi động giao diện React (mặc định cổng 3000)
npm start
```

Mở trình duyệt truy cập: **http://localhost:3000**

---

## Kiểm thử tự động (Testing)

Dự án có sẵn bộ kịch bản kiểm thử tự động hoàn chỉnh (tự động dùng `mongodb-memory-server` cô lập khi chưa bật `mongod` cục bộ):

```bash
# Kiểm thử toàn bộ REST API backend (10 kịch bản: auth, pagination, coupon, 409, overlap 400, cancel 2h, stats)
npm run test:server

# Build kiểm tra đóng gói production
npm run build
```

---

## Tài khoản mẫu & Mã giảm giá

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@udu.example` | `Admin@12345` | Quản lý phim, phòng, suất chiếu, mã giảm giá, xem thống kê doanh thu |
| **Thành viên (Member)** | `member@udu.example` | `Member@12345` | Đặt vé trên sơ đồ ghế, áp dụng mã giảm giá, xem lịch sử vé, hủy vé trước 2h |
| **Khách vãng lai** | Không cần đăng nhập | — | Xem phim đang/sắp chiếu, tìm kiếm, xem lịch chiếu |

Mã giảm giá mẫu sau khi seed: `UDU10` (giảm 10%, tối đa 30.000đ) và `VIP20` (giảm 20%, tối đa 50.000đ).

---

## Các tính năng & Điểm nhấn kỹ thuật

1. **Sơ đồ ghế tương tác:** Sinh động theo cấu hình phòng (số hàng, số ghế/hàng, danh sách hàng VIP), ghế đang chọn quản lý bằng **Redux Toolkit**, tổng tiền và giảm giá tính tự động bằng `useMemo`.
2. **Chống đặt trùng ghế (Race Condition):** Sử dụng **Partial Unique Compound Index** trên MongoDB (`{ showId: 1, "seats.seatId": 1 }` với điều kiện `status: "confirmed"`). Nếu hai người đặt cùng một ghế tại cùng thời điểm, server từ chối người sau và trả về **HTTP 409 Conflict** kèm danh sách ghế bị trùng.
3. **Đếm ngược giữ ghế:** Đồng hồ 5 phút (`setInterval` có cleanup); khi hết giờ tự động giải phóng ghế và quay về trang phim bằng `useNavigate`.
4. **Chống tạo suất chiếu chồng giờ:** Khi tạo hoặc sửa suất chiếu trong cùng một phòng, server tự động kiểm tra giao thoa thời gian `[start, end]` (tính theo thời lượng phim) và từ chối nếu bị trùng giờ (**HTTP 400**).
5. **Hủy vé trước giờ chiếu 2 tiếng:** Thành viên chỉ được hủy vé trước giờ chiếu ít nhất 2 giờ; khi hủy vé thành công (`status: "cancelled"`), chỉ mục bán phần tự động giải phóng ghế để người khác đặt lại.
6. **Thống kê doanh thu (Aggregation Pipeline):** Thống kê tổng quan, theo từng phim và theo ngày sử dụng **MongoDB Aggregation Pipeline** (`$match`, `$lookup`, `$unwind`, `$group`, `$project`, `$sort`).
7. **Tìm kiếm, lọc & phân trang phía Server:** Hỗ trợ toán tử MongoDB (`$regex`, `$in`, `$gte`, `$lte`) và phân trang chuẩn (`?page=&limit=` với `.skip()` & `.limit()`).
8. **Tính năng nâng cao:** Giao diện Sáng/Tối quản lý qua Context API, mã QR cho vé (kèm modal phóng to), mã giảm giá (`Coupons`), và cập nhật ghế đã bán theo thời gian thực qua **Socket.IO** (`socket.io-client`) kết hợp polling 5 giây.
