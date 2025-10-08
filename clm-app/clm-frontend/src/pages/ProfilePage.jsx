// src/pages/ProfilePage.jsx
import React, { useEffect, useState, useRef } from "react";
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
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
        if (data.user.logoUrl) {
          setLogoPreview(data.user.logoUrl);
        }
      })
      .catch((err) => {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file); // store file for later upload
    setLogoPreview(URL.createObjectURL(file)); // immediate preview
  };

  const handleDeleteLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("fullName", fullName);
    if (newPassword) formData.append("newPassword", newPassword);
    if (repeatPassword) formData.append("repeatPassword", repeatPassword);
    if (logoFile) formData.append("logo", logoFile);

    try {
      const res = await fetch("http://localhost:4000/api/auth/update-profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Update failed");

      const result = await res.json();
      alert(t("profilePage.saveSuccess"));

      // Update localStorage for header logo
      if (result.user.logoUrl) {
        localStorage.setItem("userLogo", result.user.logoUrl);
      }

      setLogoFile(null); // reset file input
    } catch (err) {
      console.error(err);
      alert(t("profilePage.saveError"));
    }
  };

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

        {/* Logo Upload Section */}
        <div className="logo-upload-section">
          <h2>{t("profilePage.merchantLogo")}</h2>

          <div className="logo-upload-container">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="logo-preview" />
            ) : (
              <div className="logo-placeholder">
                {t("profilePage.noLogoUploaded")}
              </div>
            )}

            <div className="logo-buttons-wrapper">
              <p className="logo-instruction">{t("profilePage.uploadInstruction")}</p>
              <div className="logo-buttons">
                <button
                  className="upload-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  {t("profilePage.uploadLogo")}
                </button>

                <button
                  className="delete-button"
                  onClick={handleDeleteLogo}
                  disabled={!logoPreview}
                >
                  {t("profilePage.deleteLogo")}
                </button>
              </div>
            </div>
          </div>

          <p className="logo-recommendation">
            {t("profilePage.uploadRecommendation")}
          </p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleLogoChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Save Button */}
        <div className="save-button-container">
          <button className="save-btn" onClick={handleSave}>
            {t("profilePage.saveChanges")}
          </button>
        </div>
      </div>
    </>
  );
}