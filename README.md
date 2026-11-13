# UDU cinematic — Đề 1: Đặt vé xem phim
1) Frontend
## Cấu trúc

```text
10_LTW_CuoiKy/
├── client/                  Toàn bộ frontend
│   ├── public/              Ảnh, font, tài nguyên tĩnh
│   ├── src/
│   │   ├── pages/           Trang chủ, phim, tài khoản, vé
│   │   ├── admin/           Giao diện quản trị
│   │   ├── App.js           Khai báo route
│   │   ├── auth.js          Mô phỏng đăng ký/đăng nhập cục bộ
│   │   ├── context.js       Tài khoản và dữ liệu dùng chung
│   │   ├── store.js         Redux Toolkit lưu ghế đang chọn
│   │   └── booking.js       Sơ đồ ghế, tính tiền, xác nhận
│   └── package.json
├── server/                  Thư mục chờ cho giai đoạn backend
├── docs/                    Hướng dẫn đọc code và đối chiếu đề
└── package.json             Lệnh chạy frontend từ thư mục gốc
```

## Cài và chạy frontend

Cần Node.js 22+ và npm. Nếu dùng NVM, chọn phiên bản Node đã cài trước. Mở terminal ở thư mục gốc:

```bash
npm --prefix client ci --legacy-peer-deps
npm start
```

Mở http://localhost:3000. Chỉ cần một terminal, không cần khởi động server hoặc seed backend.

```bash
npm test
npm run build
npm --prefix client run preview
```

Bản build ở `client/build/`; preview tại http://localhost:5300. Khi đưa lên hosting, cấu hình rewrite các route của SPA về `index.html`.

## Tài khoản mẫu trên trình duyệt

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị | admin@udu.example | Admin@12345 |
| Thành viên | member@udu.example | Member@12345 |
| Khách | Không cần tài khoản | Không cần đăng nhập |

Tài khoản mẫu tự có khi dùng chức năng tài khoản, không cần script seed. Đăng ký email mới luôn tạo **thành viên** rồi đăng nhập ngay. Admin dùng cùng form đăng nhập, không chọn vai trò. Đăng xuất đưa về trạng thái khách.

Tài khoản lưu ở localStorage (`udu-accounts`), phiên đăng nhập lưu mã tài khoản ở sessionStorage (`udu-session`). Tải lại cùng tab giữ phiên; đóng tab kết thúc phiên. Mật khẩu đăng ký được băm bằng Web Crypto/PBKDF2 thay vì lưu rõ.
## Chức năng theo vai trò

- **Khách:** danh sách đang/sắp chiếu, tìm tên, lọc thể loại/ngày, chi tiết phim, trailer YouTube, thời lượng và suất chiếu.
- **Thành viên:** quyền khách; chọn suất và ghế thường/VIP (tối đa 8), xem tổng tiền, xác nhận vé, lịch sử vé riêng và hủy khi còn ít nhất 2 giờ trước suất chiếu.
- **Quản trị:** giao diện quản lý phim, phòng (hàng/cột/hàng VIP), suất chiếu có kiểm tra chồng giờ, doanh thu theo phim/ngày.

Trang chủ có phim tiêu điểm và một số phim gợi ý; trang Phim có danh sách đầy đủ và bộ lọc. Các dòng footer theo ảnh yêu cầu và nút nhập vai đã được bỏ.
