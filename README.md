# UDU cinematic 

Hệ thống web full-stack đặt vé xem phim trực tuyến: Khách xem lịch chiếu, thành viên chọn suất và ghế trên sơ đồ tương tác để đặt vé, quản trị viên quản lý phim, phòng chiếu, suất chiếu và theo dõi thống kê doanh thu.

---

## Cấu trúc thư mục

```text
10_LTW_CuoiKy/
├── client/                  Toàn bộ frontend (React, Redux Toolkit, React Router)
│   ├── public/              Ảnh poster, font, tài nguyên tĩnh
│   ├── src/
│   │   ├── admin/           Giao diện quản trị (dashboard, phim, phòng, suất chiếu)
│   │   ├── pages/           Trang chủ, danh sách phim, chi tiết phim, lịch chiếu, vé của tôi
│   │   ├── api.js           Module gọi REST API tập trung, tự động gắn JWT
│   │   ├── App.js           Khai báo router, nested routes & route bảo vệ
│   │   ├── auth.js          Quản lý tài khoản, phiên đăng nhập JWT
│   │   ├── booking.js       Sơ đồ ghế động, tính tiền useMemo, đếm ngược 5 phút
│   │   ├── components.js    Các components tái sử dụng (Header, Footer, Button, Field,...)
│   │   ├── context.js       Context API dữ liệu dùng chung & đồng bộ API
│   │   ├── data.js          Hàm tiện ích định dạng ngày giờ, tiền tệ
│   │   └── store.js         Redux Toolkit quản lý ghế đang chọn & phiên đặt vé
│   └── package.json
├── server/                  Toàn bộ backend (Node.js, Express, SQLite/MySQL, Sequelize)
│   ├── src/
│   │   ├── config/          Kết nối CSDL SQLite/MySQL qua Sequelize
│   │   ├── controllers/     Xử lý logic nghiệp vụ các tài nguyên
│   │   ├── middlewares/     Xác thực JWT, phân quyền Admin, xử lý lỗi tập trung
│   │   ├── models/          Khai báo bảng và quan hệ CSDL (ORM)
│   │   ├── routes/          Định tuyến REST API chuẩn
│   │   ├── utils/           Tiện ích sinh ID dễ nhớ (chuẩn dữ liệu seed)
│   │   └── seed/            Script nạp dữ liệu mẫu ban đầu
│   ├── tests/               Bộ kiểm thử tính bền vững và logic nghiệp vụ
│   ├── database.sqlite      File CSDL SQLite (zero-config)
│   ├── server.js            Entry point khởi động server Express + Socket.io
│   ├── testApi.js           Kịch bản kiểm thử tự động toàn bộ API
│   ├── .env.example         Mẫu biến môi trường
│   └── package.json
├── documentation.md         Tài liệu kỹ thuật và giải thích chi tiết toàn bộ code
└── package.json             Lệnh điều khiển toàn bộ dự án từ thư mục gốc
```

---

## Hướng dẫn cài đặt & Khởi chạy

Yêu cầu môi trường: **Node.js 20+** và **npm**.

### 1. Chạy Backend

Mở terminal tại thư mục gốc:

```bash
# Cài đặt thư viện backend
npm --prefix server install

# Nạp dữ liệu mẫu (phim, phòng, suất chiếu, tài khoản demo)
npm run seed

# Khởi động backend (mặc định cổng 5000)
npm run server
```

> **Ghi chú CSDL:** Mặc định hệ thống sử dụng **SQLite** (`server/database.sqlite`), không cần cài đặt thêm phần mềm máy chủ CSDL. Nếu muốn chuyển sang **MySQL**, xem hướng dẫn trong [server/README.md](file:///c:/Users/hungs/Documents/code%20củng%20udu2/react/10_LTW_CuoiKy/server/README.md) hoặc [documentation.md](file:///c:/Users/hungs/Documents/code%20củng%20udu2/react/10_LTW_CuoiKy/documentation.md).

### 2. Chạy Frontend

Mở một terminal khác tại thư mục gốc:

```bash
# Cài đặt thư viện frontend
npm --prefix client ci --legacy-peer-deps

# Khởi động giao diện React (mặc định cổng 3000)
npm start
```

Mở trình duyệt truy cập: **http://localhost:3000**

---

## Kiểm thử tự động (Testing)

Dự án có sẵn bộ kịch bản kiểm thử tự động hoàn chỉnh:

```bash
# Kiểm thử toàn bộ API backend (10 kịch bản: auth, conflict 409, overlap 400, cancel 2h, stats)
npm run test:server

# Kiểm thử các luồng giao diện frontend (25 kịch bản kiểm thử tích hợp trên 3 test suites)
npm test

# Build kiểm tra đóng gói production
npm run build
```

---

## Tài khoản mẫu

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@udu.example` | `Admin@12345` | Quản lý phim, phòng, suất chiếu, xem thống kê doanh thu |
| **Thành viên (Member)** | `member@udu.example` | `Member@12345` | Đặt vé trên sơ đồ ghế, xem lịch sử vé, hủy vé trước 2h |
| **Khách vãng lai** | Không cần đăng nhập | — | Xem phim đang/sắp chiếu, tìm kiếm, xem lịch chiếu |

---

## Các tính năng & Điểm nhấn kỹ thuật

1. **Sơ đồ ghế tương tác:** Sinh động theo cấu hình phòng (số hàng, số ghế/hàng, danh sách hàng VIP), ghế đang chọn quản lý bằng **Redux Toolkit**, tổng tiền tính tự động bằng `useMemo`.
2. **Chống đặt trùng ghế (Race Condition):** Xử lý trong **Database Transaction**. Nếu ghế đã bị người khác đặt, server từ chối và trả về mã lỗi **HTTP 409 Conflict** kèm danh sách ghế bị trùng.
3. **Đếm ngược giữ ghế:** Đồng hồ 5 phút (`setInterval` có cleanup); khi hết giờ tự động giải phóng ghế và quay về trang phim bằng `useNavigate`.
4. **Chống tạo suất chiếu chồng giờ:** Khi tạo suất chiếu mới trong cùng một phòng, server tự động kiểm tra giao thoa thời gian `[start, end]` (tính theo thời lượng phim) và từ chối nếu bị trùng giờ (**HTTP 400**).
5. **Hủy vé trước giờ chiếu 2 tiếng:** Thành viên chỉ được hủy vé trước giờ chiếu ít nhất 2 giờ; khi hủy vé thành công, chỗ ngồi được trả lại trạng thái trống trên sơ đồ.
6. **Thống kê doanh thu:** Thống kê doanh thu theo từng phim và theo ngày sử dụng truy vấn tổng hợp SQL (`GROUP BY`, `SUM`, `COUNT`).
7. **Mã QR cho vé:** Tự động sinh mã QR Data URL cho mỗi vé đặt thành công.
8. **Cập nhật thời gian thực:** Tích hợp **Socket.IO** phát sự kiện khi ghế được đặt hoặc hoàn trả.
