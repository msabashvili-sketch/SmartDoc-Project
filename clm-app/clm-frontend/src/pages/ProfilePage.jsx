// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [user, setUser] = useState({});
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setFullName(data.user.name || "");
      })
      .catch((err) => {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  return (
    <>
      <DashboardHeader />
      <div className="profile-page-wrapper">
        <h1 className="profile-title">{t("profilePage.personalInformation")}</h1>
        <div className="profile-form-grid">
          <div className="profile-field">
            <label>{t("profilePage.fullName")}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("profilePage.fullNamePlaceholder")}
            />
          </div>

          <div className="profile-field">
            <label>{t("profilePage.emailAddress")}</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              placeholder={t("profilePage.emailPlaceholder")}
            />
          </div>

          <div className="profile-field">
            <label>{t("profilePage.newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("profilePage.newPasswordPlaceholder")}
            />
          </div>

          <div className="profile-field">
            <label>{t("profilePage.repeatNewPassword")}</label>
            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder={t("profilePage.repeatNewPasswordPlaceholder")}
            />
          </div>
        </div>
      </div>
    </>
  );
}