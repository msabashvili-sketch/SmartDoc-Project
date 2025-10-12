import React, { useState, useEffect } from "react";
import "./FilterPanel.css";

export default function FilterPanel({
  isOpen,
  onClose,
  onApply,
  onClear,
  children,
  documentType,
  onDocumentTypeChange,
}) {
  const [expireMode, setExpireMode] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [show, setShow] = useState(false); // controls opacity

  // Only trigger show after first render
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  const handleExpireModeClick = (mode) => setExpireMode(mode);

  return (
    <div className={`filter-panel ${show ? "show" : ""} ${isOpen ? "open" : ""}`}>
      {/* Header */}
      <div className="filter-header">
        <div className="filter-header-buttons">
          <button className="filter-btn" onClick={onApply}>
            <img src="/assets/filter-icon.png" alt="Filter" className="filter-btn-icon" />
            Filter
          </button>
          <button className="clear-btn" onClick={onClear}>
            Clear
          </button>
        </div>
        <button className="filter-close-btn" onClick={onClose}>×</button>
      </div>

      {/* Filter content */}
      <div className="filter-content">
        <div className="filter-field">
          <label htmlFor="documentType">Document Type</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
          >
            <option value="">All</option>
            <option value="Contract">Contract</option>
            <option value="Invoice">Invoice</option>
            <option value="Report">Report</option>
          </select>
        </div>

        <div className="filter-field expire-date-field">
          <label>Expire Date</label>
          <div className="expire-buttons">
            <button className={expireMode === "before" ? "active" : ""} onClick={() => handleExpireModeClick("before")}>Before</button>
            <button className={expireMode === "after" ? "active" : ""} onClick={() => handleExpireModeClick("after")}>After</button>
            <button className={expireMode === "on" ? "active" : ""} onClick={() => handleExpireModeClick("on")}>On</button>
          </div>
          <input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />
        </div>

        {children}
      </div>
    </div>
  );
}