import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Import SVG as React component
import { ReactComponent as SettingsIcon } from "../assets/settings-icon2.svg";

import "./DashboardHeader.css";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [logo, setLogo] = useState(null);
  const [userEmail, setUserEmail] = useState("");

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

      {/* Right: User Profile */}
      <div className="dashboard-header-right">
        <div className="profile">
          {userEmail && <span className="user-email">{userEmail}</span>}

          {/* Settings button using SVG component */}
          <button className="settings-btn" onClick={handleSettings}>
            <SettingsIcon className="settings-icon" />
          </button>

          <button onClick={handleLogout} className="logout-btn">
            {t("dashboardheader.logout") || "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}