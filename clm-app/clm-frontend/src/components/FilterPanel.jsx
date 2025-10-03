import React from "react";
import "./FilterPanel.css";

export default function FilterPanel({ isOpen, onClose, filters, onFilterChange, onReset }) {
  return (
    <div className={`filter-panel ${isOpen ? "open" : ""}`}>
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="filter-content">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-item">
            <label>{filter.label}</label>
            {filter.type === "text" && (
              <input
                type="text"
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              />
            )}
            {filter.type === "select" && (
              <select
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="filter-footer">
        <button className="reset-btn" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}