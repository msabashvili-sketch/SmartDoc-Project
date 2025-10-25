import React, { useEffect, useState } from "react";
import "./TextViewer.css";

export default function TextViewer({ file, onClose }) {
  const [text, setText] = useState("");
  const [aiTags, setAiTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!file) return;

    const fileId = file.id || file.textDocId;
    if (!fileId) {
      console.error("❌ No valid file ID provided for TextViewer.");
      setText("No text available");
      setAiTags([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      fetch(`http://localhost:4000/api/documents/text/${fileId}`)
        .then((res) => res.json())
        .then((data) => data.text || "OCR text not available")
        .catch(() => "OCR text not available"),

      fetch(`http://localhost:4000/api/documents/tags/${fileId}`)
        .then((res) => res.json())
        .catch(() => []),
    ])
      .then(([ocrText, tagData]) => {
        setText(ocrText);
        setAiTags(tagData || []);
      })
      .finally(() => setLoading(false));

    setIsOpen(true);
  }, [file]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
      onClose();
    }, 300);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.6));

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="highlight">{part}</mark> : part
    );
  };

  // Split text into pages (roughly every 1500 characters for layout)
   // Split text into pages with smart cleanup
const textPages = (() => {
  if (!text) return [];

  // 1️⃣ Normalize line breaks
  let cleanedText = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n\n");

  // 2️⃣ Merge OCR mid-sentence line breaks (e.g., "con-\ntract" → "contract")
  cleanedText = cleanedText.replace(/([a-z,;:])\n([a-z])/gi, "$1 $2");

  // 3️⃣ Clean up multiple spaces
  cleanedText = cleanedText.replace(/ {2,}/g, " ");

  // 4️⃣ Split into pages by paragraph or sentence (approx 3000 chars per page)
  const regex = /(.{1,3000}(?:[\n]|\.|$))/gs;
  const pages = cleanedText.match(regex) || [cleanedText];

  return pages.map(p => p.trim()).filter(p => p.length > 0);
})();

  if (!file) return null;

  return (
    <div className={`text-viewer-container ${isOpen ? "open" : ""} ${isClosing ? "closing" : ""}`}>
      <div className="text-viewer-body two-column-layout">
        {/* Left: Document Viewer */}
        <div className="viewer-panel">
          <div className="panel-header">
            <div className="header-controls">
              <div className="zoom-controls">
                <button onClick={handleZoomOut}>−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn}>+</button>
              </div>
              <input
                type="text"
                className="search-bar"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="panel-content">
            {loading ? (
              <div className="text-viewer-loading">Loading...</div>
            ) : (
              <div className="text-pages" style={{ fontSize: `${zoom * 16}px` }}>
                {textPages.map((page, i) => (
                  <div key={i} className="text-page">
                    {highlightText(page, searchTerm)}
                    <div className="page-number">{i + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Tags + Document Title */}
        <div className="tags-panel">
          <div className="panel-header right-header">
            <h3 className="document-title">{file.originalName || file.filename}</h3>
            <button className="text-viewer-close-btn" onClick={handleClose}>×</button>
          </div>

          <div className="panel-content">
            {aiTags && aiTags.length > 0 ? (
              <ul>
                {aiTags.map((tag, index) => (
                  <li key={index}>{tag}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">No AI tags available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}