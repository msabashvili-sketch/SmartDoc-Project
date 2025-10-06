import React, { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./DashboardHeader.css";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [logo, setLogo] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem("brandLogo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user?.email) {
          setUserEmail(data.user.email);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        localStorage.removeItem("token");
        navigate("/"); // redirect to login if token invalid
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="dashboard-header">
      {/* Left: Logo & Navigation */}
      <div className="dashboard-header-left">
        <div className="logo">
          {logo ? (
            <img src={logo} alt="Brand Logo" className="header-logo" />
          ) : (
            "CLM"
          )}
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className="navLink">
            {t("dashboardheader.dashboard")}
          </NavLink>
          <NavLink to="/imports" className="navLink">
            {t("dashboardheader.import")}
          </NavLink>
          <NavLink to="/folders" className="navLink folders-link">
            {t("dashboardheader.folders")}
          </NavLink>
          <NavLink to="/repository" className="navLink">
            {t("dashboardheader.repository")}
          </NavLink>
          <NavLink to="/archive" className="navLink">
            {t("dashboardheader.archive")}
          </NavLink>
        </nav>
      </div>

      {/* Right: User Profile Dropdown */}
      <div className="dashboard-header-right" ref={menuRef}>
        <div className="profile">
          {userEmail && (
            <button
              className="user-email-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {userEmail}
            </button>
          )}

          {menuOpen && (
            <div className="profile-dropdown">
              <button onClick={() => navigate("/profile")}>
                <img
                  src="/assets/profile-icon.png"
                  alt="Profile"
                  className="dropdown-icon"
                />
                {t("dashboardheader.profile") || "Profile"}
              </button>
              <button onClick={handleSettings}>
                <img
                  src="/assets/settings-icon7.png"
                  alt="Settings"
                  className="dropdown-icon"
                />
                {t("dashboardheader.settings") || "Settings"}
              </button>
              <button onClick={handleLogout}>
                <img
                  src="/assets/logout-icon.png"
                  alt="Logout"
                  className="dropdown-icon"
                />
                {t("dashboardheader.logout") || "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}