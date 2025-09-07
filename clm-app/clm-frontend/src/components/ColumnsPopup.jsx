import React, { useRef, useEffect } from "react";
import "./ColumnsPopup.css";

export default function ColumnsPopup({
  isOpen,
  onClose,
  columns,
  visibleColumns,
  onToggleColumn,
  anchorRef,
}) {
  const popupRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div className="columns-popup" ref={popupRef}>
      <h4>Select Columns</h4>
      <ul>
        {columns.map((col) => (
          <li key={col.key}>
            <label>
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => onToggleColumn(col.key)}
              />
              {col.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}