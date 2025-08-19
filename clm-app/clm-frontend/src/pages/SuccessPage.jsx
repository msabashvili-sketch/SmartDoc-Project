import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SuccessPage = () => {
  const { t } = useTranslation();

  return (
    <div style={styles.container}>
      <div style={styles.iconCircle}>
        <span style={styles.checkmark}>✔</span>
      </div>
      <h1 style={styles.title}>{t("success.title")}</h1>
      <p style={styles.message}>
        {t("success.messageBefore")}{" "}
        <Link to="/signin" style={styles.link}>
          {t("success.messageLink")}
        </Link>
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    textAlign: "center",
    padding: "20px",
  },
  iconCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor: "#3DD799",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  checkmark: {
    color: "white",
    fontSize: "50px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "10px",
  },
  message: {
    fontSize: "16px",
    maxWidth: "700px",
    whiteSpace: "nowrap", // keeps it on one line
  },
  link: {
    color: "#438985",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default SuccessPage;
