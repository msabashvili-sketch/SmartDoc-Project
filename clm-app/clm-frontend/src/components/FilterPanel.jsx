import React from "react";
import "./FilterPanel.css";

export default function FilterPanel({ isOpen, onApply }) {
  return (
    <div className={`filter-panel ${isOpen ? "open" : ""}`}>
      <h3>Filter Options</h3>

      <div className="filter-group">
        <label>
          <input type="checkbox" name="status" value="active" /> Active
        </label>
        <label>
          <input type="checkbox" name="status" value="archived" /> Archived
        </label>
      </div>

      <div className="filter-group">
        <label>
          Date from: <input type="date" name="date_from" />
        </label>
        <label>
          Date to: <input type="date" name="date_to" />
        </label>
      </div>

      <button className="apply-filters" onClick={onApply}>
        Apply
      </button>
    </div>
  );
}