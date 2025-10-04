// FilterPanel.jsx
export default function FilterPanel({ isOpen }) {
  return (
    <div className={`filter-panel ${isOpen ? "open" : ""}`}>
      <h3>Filters</h3>
      {/* Add your filter options here */}
      <div className="filter-option">
        <label>Status:</label>
        <select>
          <option>All</option>
          <option>Active</option>
          <option>Archived</option>
        </select>
      </div>
      <div className="filter-option">
        <label>Date:</label>
        <input type="date" />
      </div>
    </div>
  );
}