import { Link } from "react-router-dom";
import { Arrow, EmptyState } from "../components";

// State ở trên, hàm xử lý ở giữa, JSX giao diện ở dưới.
export const NotFoundPage = () => (
  <div className="wrap page-shell">
    <EmptyState
      title="Suất phim này không tồn tại"
      action={
        <Link to="/phim" className="btn btn--primary">
          Xem danh sách phim <Arrow />
        </Link>
      }
    >
      Có thể đường dẫn đã thay đổi. Hãy chọn một bộ phim khác nhé.
    </EmptyState>
  </div>
);
