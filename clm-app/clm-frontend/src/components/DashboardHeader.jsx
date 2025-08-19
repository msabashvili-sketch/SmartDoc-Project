import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./DashboardHeader.css";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem("brandLogo");
    if (storedLogo) setLogo(storedLogo);
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

      {/* Right: User Profile */}
      <div className="dashboard-header-right">
        <div className="profile">
          <img src="https://via.placeholder.com/28" alt="Profile" />
          <span>{t("dashboardheader.user name")}</span>
        </div>
      </div>
    </header>
  );
}