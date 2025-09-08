import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegistrationForm from "./pages/RegistrationForm";
import SignInForm from "./pages/SignInForm";
import SuccessPage from "./pages/SuccessPage";
import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import RepositoryPage from "./pages/RepositoryPage";
import FoldersPage from "./pages/FoldersPage";
import AdminPage from "./pages/admin/AdminPage";
import "./i18n";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<RegistrationForm />} />
        <Route path="/signin" element={<SignInForm />} />
        <Route path="/registration-success" element={<SuccessPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/imports" element={<ImportPage />} />
        <Route path="/repository" element={<RepositoryPage />} />
        
        {/* Updated folder routes */}
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/folders/:folderId" element={<FoldersPage />} />

        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}