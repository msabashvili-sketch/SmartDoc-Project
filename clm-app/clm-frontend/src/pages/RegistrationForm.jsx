import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import { useTranslation } from "react-i18next";
import './RegistrationForm.css';

export default function RegistrationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // ✅ for redirecting
  const [userType, setUserType] = useState("individual");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (res.ok) {
        // ✅ Redirect to success page after registration
        navigate("/registration-success");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <>
      <Header />
      <div className="reg-container">
        <div className="reg-box">
          <h2 className="reg-title">{t("registration.title")}</h2>

          <form className="reg-form" onSubmit={handleSubmit}>
            {/* Email Address */}
            <input 
              id="email"
              name="email"
              type="email" 
              placeholder={t("registration.email")} 
              className="reg-input" 
              required 
            />

            {/* First and Last Name */}
            <div className="reg-grid-two-cols">
              <div>
                <label htmlFor="firstName" className="sr-only">{t("registration.firstName")}</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={t("registration.firstName")}
                  required
                  className="reg-input"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">{t("registration.lastName")}</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={t("registration.lastName")}
                  required
                  className="reg-input"
                />
              </div>
            </div>

            {/* User Type Buttons */}
            <div>
              <p className="reg-label user-type-label">{t("registration.userType.label")}</p>
              <div className="reg-btn-group">
                <button
                  type="button"
                  onClick={() => setUserType("individual")}
                  className={`reg-btn ${userType === "individual" ? "active" : ""}`}
                >
                  {t("registration.userType.individual")}
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("business")}
                  className={`reg-btn ${userType === "business" ? "active" : ""}`}
                >
                  {t("registration.userType.business")}
                </button>
              </div>
            </div>

            {/* Business Fields */}
            {userType === "business" && (
              <div className="reg-grid-two-cols">
                <div>
                  <label htmlFor="businessName" className="sr-only">{t("registration.businessName")}</label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder={t("registration.businessName")}
                    className="reg-input"
                  />
                </div>
                <div>
                  <label htmlFor="idNumber" className="sr-only">{t("registration.idNumber")}</label>
                  <input
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    placeholder={t("registration.idNumber")}
                    className="reg-input"
                  />
                </div>
              </div>
            )}

            {/* Password and Confirm Password */}
            <div className="reg-grid-two-cols">
              <div>
                <label htmlFor="password" className="sr-only">{t("registration.password")}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("registration.password")}
                  required
                  className="reg-input"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">{t("registration.confirmPassword")}</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("registration.confirmPassword")}
                  required
                  className="reg-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button type="submit" className="reg-submit-btn">
                {t("registration.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
