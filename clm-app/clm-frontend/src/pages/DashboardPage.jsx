// src/pages/DashboardPage.jsx
import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import "./DashboardPage.css";

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <DashboardHeader />
      <div className="dashboard-body">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h4>Views</h4>
            <a href="#">⭐ Starred <span>0</span></a>
            <a href="#">All <span>0</span></a>
          </div>

          <div className="sidebar-section">
            <h4>Workflows</h4>
            <a href="#" className="active">In progress <span>0</span></a>
            <a href="#">Owned by me <span>0</span></a>
            <a href="#">Needs my signature <span>0</span></a>
            <a href="#">Assigned to me <span>0</span></a>
            <a href="#">Participating in <span>0</span></a>
            <a href="#">Completed <span>0</span></a>
          </div>

          <div className="sidebar-section">
            <h4>Repository</h4>
            <a href="#">All records <span>0</span></a>
            <a href="#">Active <span>0</span></a>
            <a href="#">Upcoming deadlines <span>0</span></a>
            <a href="#">Updated predictions <span>0</span></a>
            <a href="#">Duplicates <span>0</span></a>
          </div>

          <div className="sidebar-section">
            <h4>My Views</h4>
            <a href="#">▼ Custom Views</a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <h1 className="page-title">In progress</h1>

          {/* Info Banner */}
          <div className="info-banner">
            <div>
              <h3>Launch and negotiate contracts from one place</h3>
              <p>Generate documents, negotiate and approve changes, and sign all your contracts.</p>
            </div>
            <button className="primary-btn">Start workflow</button>
          </div>

          {/* Filters */}
          <div className="filters">
            <span className="filter-pill">Stage (1)</span>
            <span className="filter-pill">Type</span>
            <span className="filter-pill">Counterparty</span>
            <span className="filter-pill">People</span>
            <span className="filter-pill">Date</span>
            <span className="filter-pill">All (1)</span>
            <input type="text" placeholder="Search..." className="filter-search" />
          </div>

          {/* Empty State */}
          <div className="empty-state">
            <img src="https://via.placeholder.com/80" alt="Empty" />
            <p>All done. 🎉</p>
          </div>
        </main>

      </div>
    </div>
  );
}
