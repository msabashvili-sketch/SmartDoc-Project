import React, { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./DashboardHeader.css";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [brandLogo, setBrandLogo] = useState(null);
  const [userLogo, setUserLogo] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const storedBrandLogo = localStorage.getItem("brandLogo");
    if (storedBrandLogo) setBrandLogo(storedBrandLogo);

    const storedUserLogo = localStorage.getItem("userLogo");
    if (storedUserLogo) setUserLogo(storedUserLogo);

    // Listen for changes in localStorage (for reactive update)
    const handleStorageChange = (e) => {
      if (e.key === "userLogo") {
        setUserLogo(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
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
        if (data.user?.email) setUserEmail(data.user.email);
        if (data.user?.logoUrl) {
          setUserLogo(data.user.logoUrl);
          localStorage.setItem("userLogo", data.user.logoUrl);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

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
      <div className="dashboard-header-left">
        <div className="logos-container">
          {brandLogo ? (
            <img src={brandLogo} alt="Brand Logo" className="header-logo" />
          ) : (
            "CLM"
          )}

          {userLogo && <div className="vertical-divider" />}

          {userLogo && (
            <img src={userLogo} alt="User Logo" className="header-logo" />
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