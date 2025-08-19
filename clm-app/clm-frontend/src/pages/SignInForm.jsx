import React from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import "./SignInForm.css";

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        // store token in localStorage (optional)
        localStorage.setItem("token", data.token);

        alert("Login successful!");
        // redirect to dashboard page
        navigate("/dashboard");
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
      <div className="signin-container">
        <div className="signin-box">
          <h2 className="signin-title">{t("signIn")}</h2>

          <form className="signin-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="signin-group">
              <input
                type="email"
                name="email"
                placeholder={t("registration.email")}
                required
                className="signin-input"
              />
            </div>

            {/* Password */}
            <div className="signin-group">
              <input
                type="password"
                name="password"
                placeholder={t("registration.password")}
                required
                className="signin-input"
              />
            </div>

            {/* Forget Password Link */}
            <div className="forgot-password">
              <a href="/forgot-password">{t("registration.forgotPassword")}</a>
            </div>

            {/* Submit Button */}
            <div>
              <button type="submit" className="signin-submit-btn">
                {t("signIn")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
