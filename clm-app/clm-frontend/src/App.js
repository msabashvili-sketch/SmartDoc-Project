import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegistrationForm from "./pages/RegistrationForm";
import SignInForm from "./pages/SignInForm";
import SuccessPage from "./pages/SuccessPage"; // ✅ Import the success page
import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import RepositoryPage from "./pages/RepositoryPage";
import AdminPage from "./pages/admin/AdminPage";
import "./i18n";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<RegistrationForm />} />
        <Route path="/signin" element={<SignInForm />} />
        <Route path="/registration-success" element={<SuccessPage />} /> {/* ✅ New route */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/imports" element={<ImportPage />} />
        <Route path="/repository" element={<RepositoryPage />} /> {/* new route */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}
