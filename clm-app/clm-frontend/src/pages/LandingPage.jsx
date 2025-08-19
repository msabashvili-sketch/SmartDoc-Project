import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";

export default function LandingPage() {
  const { t } = useTranslation();

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color: "#0f172a",
      background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 36px",
      boxSizing: "border-box",
    },
    logo: {
      fontSize: "20px",
      fontWeight: 800,
      letterSpacing: 0.5,
    },
    actions: {
      display: "flex",
      gap: 12,
      alignItems: "center",
    },
    hero: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      textAlign: "center",
    },
    title: {
      fontSize: 40,
      lineHeight: 1.05,
      margin: 0,
      marginBottom: 12,
      fontWeight: 700,
      color: "#0b1220",
    },
    subtitle: {
      fontSize: 18,
      margin: 0,
      color: "#475569",
      maxWidth: 760,
      marginLeft: "auto",
      marginRight: "auto",
    },
    cta: {
      marginTop: 20,
      display: "flex",
      gap: 12,
      justifyContent: "center",
    },
    buttonPrimary: {
      padding: "12px 20px",
      borderRadius: 8,
      background: "#2563eb",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 14,
    },
    buttonOutline: {
      padding: "10px 18px",
      borderRadius: 8,
      background: "transparent",
      color: "#2563eb",
      border: "2px solid #2563eb",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 14,
    },
    footer: {
      padding: "18px 24px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 13,
    },
  };

  return (
    <div style={styles.container}>
      <Header />

      <main style={styles.hero}>
        <div>
          <h1 style={styles.title}>{t("mainTitle")}</h1>
          <p style={styles.subtitle}>{t("mainSubtitle")}</p>

          <div style={styles.cta}>
            <Link to="/signup">
              <button style={styles.buttonPrimary}>{t("createAccount")}</button>
            </Link>
            <Link to="/signin">
              <button style={styles.buttonOutline}>{t("learnMore")}</button>
            </Link>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>© {new Date().getFullYear()} CLM — {t("builtWithLove")}</footer>
    </div>
  );
}
