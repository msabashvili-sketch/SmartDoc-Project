import React, { useState, useEffect } from "react";

export default function AdminPage() {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    // Load logo from localStorage if exists
    const storedLogo = localStorage.getItem("brandLogo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result;
        setLogo(logoData);
        localStorage.setItem("brandLogo", logoData); // save to localStorage
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Panel</h2>
      <div>
        <label>
          Upload Brand Logo:
          <input type="file" onChange={handleLogoUpload} accept="image/*" />
        </label>
      </div>
      {logo && (
        <div style={{ marginTop: "20px" }}>
          <img src={logo} alt="Brand Logo" style={{ maxWidth: "200px" }} />
        </div>
      )}
    </div>
  );
}