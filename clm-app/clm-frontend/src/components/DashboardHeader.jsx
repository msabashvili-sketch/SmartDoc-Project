import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./DashboardHeader.css";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);
  const [email, setEmail] = useState(""); // ✅ store user email

  useEffect(() => {
    const storedLogo = localStorage.getItem("brandLogo");
    if (storedLogo) setLogo(storedLogo);

    // Fetch user info from backend
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken"); // assume JWT token stored
        const res = await fetch("http://localhost:4000/api/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setEmail(data.email || "user@example.com"); // ✅ show email
      } catch (err) {
        console.error(err);
        setEmail("user@example.com"); // fallback
      }
    };

    fetchUser();
  }, []);

  return (
    <header className="dashboard-header">
      {/* Left: Logo & Navigation */}
      <div className="dashboard-header-left">
        <div className="logo">
          {logo ? (
            <img src={logo} alt="Brand Logo" style={{ maxHeight: "30px" }} />
          ) : (
            "CLM"
          )}
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className="navLink">{t("dashboardheader.dashboard")}</NavLink>
          <NavLink to="/imports" className="navLink">{t("dashboardheader.import")}</NavLink>
          <NavLink to="/folders" className="navLink">{t("dashboardheader.folders")}</NavLink>
          <NavLink to="/repository" className="navLink">{t("dashboardheader.repository")}</NavLink>
          <NavLink to="/archive" className="navLink">{t("dashboardheader.archive")}</NavLink>
        </nav>
      </div>

      {/* Right: User Email */}
      <div className="dashboard-header-right">
        <div className="profile">
          <span>{email}</span> {/* ✅ display email */}
          <div className="profile-dropdown">
            <ul>
              <li>Profile</li>
              <li>Settings</li>
              <li>Logout</li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}