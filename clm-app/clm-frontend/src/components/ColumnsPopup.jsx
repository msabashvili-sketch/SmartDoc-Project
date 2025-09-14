import React, { useRef, useState, useEffect } from "react";
import "./ColumnsPopup.css";

function ColumnsPopup({ columns, visibleColumns, onToggleColumn, onClose, anchorRef }) {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position popup relative to the button
  useEffect(() => {
    if (anchorRef.current && popupRef.current) {
      const buttonRect = anchorRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();

      let top = buttonRect.bottom + window.scrollY + 4; // gap below button
      let left = buttonRect.left + window.scrollX;

      // Prevent right overflow
      if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
      }

      // Prevent bottom overflow
      if (top + popupRect.height > window.innerHeight - 8) {
        top = buttonRect.top + window.scrollY - popupRect.height - 4;
      }

      setPosition({ top, left });
    }
  }, [anchorRef, columns.length]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  return (
    <div
      className="columns-popup"
      ref={popupRef}
      style={{ top: position.top, left: position.left, position: "absolute", zIndex: 1000 }}
    >
      <h4>Select Columns</h4>
      <ul>
        {columns.map((col) => (
          <li key={col.key}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => onToggleColumn(col.key)}
              />
              <span className="slider"></span>
              {col.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ColumnsPopup;