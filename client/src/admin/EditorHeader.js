import { X } from "lucide-react";

export const EditorHeader = ({ title, onClose }) => (
  <div className="editor-header">
    <h2>{title}</h2>
    <button
      className="icon-button"
      onClick={onClose}
      aria-label="Đóng biểu mẫu"
      type="button"
    >
      <X size={20} />
    </button>
  </div>
);
