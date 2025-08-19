import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header>
      <div className="logo">CLM</div>

      <nav>
        <a href="#" className="navLink">{t("solutions")}</a>
        <a href="#" className="navLink">{t("customers")}</a>
        <a href="#" className="navLink">{t("company")}</a>
        <a href="#" className="navLink">{t("price")}</a>
      </nav>

      <div className="actions">
        <Link to="/signin">
          <button className="buttonSignIn" aria-label={t("signIn")}>
            {t("signIn")}
          </button>
        </Link>
        <Link to="/signup">
          <button className="buttonPrimary" aria-label={t("signUp")}>
            {t("signUp")}
          </button>
        </Link>
      </div>
    </header>
  );
}
