import { Link } from "react-router-dom";
import { Arrow, Breadcrumb, PageHeading } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const GuidePage = () => (
  <div className="wrap page-shell guide-page">
    <Breadcrumb current="Hướng dẫn đặt vé" />
    <PageHeading title="Một buổi phim, ba bước.">
      Chọn suất chiếu, chọn ghế và xác nhận vé.
    </PageHeading>
    <div className="guide-grid">
      {[
        [
          "01",
          "Chọn phim và suất",
          "Xem lịch chiếu, chọn ngày và giờ phù hợp. Đăng nhập tài khoản thành viên trước khi chọn ghế.",
        ],
        [
          "02",
          "Chọn chỗ ngồi",
          "Chọn tối đa 8 ghế thường hoặc VIP. Bạn có 5 phút để hoàn tất; hết giờ, ghế đang chọn sẽ được bỏ chọn.",
        ],
        [
          "03",
          "Xác nhận vé",
          "Kiểm tra phim, ngày giờ, ghế và tổng tiền. Vé được lưu ở mục Vé của tôi. Bạn được hủy vé trước giờ chiếu ít nhất 2 giờ.",
        ],
      ].map(([number, title, body]) => (
        <article key={number}>
          <span>{number}</span>
          <h2>{title}</h2>
          <p>{body}</p>
        </article>
      ))}
    </div>
    <Link to="/lich-chieu" className="btn btn--primary">
      Chọn suất chiếu <Arrow />
    </Link>
  </div>
);
