import React, { useEffect, useState, useRef } from "react";
import "./TextViewer.css";

export default function TextViewer({ file, onClose }) {
  const [text, setText] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [layoutPages, setLayoutPages] = useState([]);
  const [hasLayout, setHasLayout] = useState(false);

  const containerRef = useRef(null);
  const matchRefs = useRef([]);
  const pageRefs = useRef([]);

  // A4 base size in px (approx. at 96 DPI)
  const BASE_WIDTH = 794;   // ~210mm @ 96dpi
  const BASE_HEIGHT = 1123; // ~297mm @ 96dpi

  // Split text into pages (~3300 chars each) — keep your splitting logic
  const textPages = (() => {
    if (!text) return [];
    let cleaned = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n\n");
    cleaned = cleaned.replace(/([a-z,;:])\n([a-z])/gi, "$1 $2");
    cleaned = cleaned.replace(/ {2,}/g, " ");
    const regex = /(.{1,3300}(?:[\n]|\.|$))/gs;
    const pages = cleaned.match(regex) || [cleaned];
    return pages.map((p) => p.trim()).filter((p) => p.length > 0);
  })();

  // Fetch text when file changes
  useEffect(() => {
    if (!file) return;
    const fileId = file.id || file.textDocId;
    if (!fileId) return;

    setLoadingText(true);
    fetch(`http://localhost:4000/api/documents/text/${fileId}`)
      .then((res) => res.json())
      .then((data) => {
  setText(data.text || "");
  if (data.layoutPages && data.layoutPages.length > 0) {
    setLayoutPages(data.layoutPages);
    setHasLayout(true);
  } else {
    setLayoutPages([]);
    setHasLayout(false);
  }
})
      .catch(() => setText(""))
      .finally(() => setLoadingText(false));

    setIsOpen(true);
  }, [file]);

  // Compute matches
  useEffect(() => {
    if (!searchTerm) {
      setMatches([]);
      setSelectedMatchIndex(0);
      matchRefs.current = [];
      return;
    }

    const newMatches = [];
    textPages.forEach((pageText, pageIndex) => {
      const regex = new RegExp(searchTerm, "gi");
      let match;
      while ((match = regex.exec(pageText)) !== null) {
        newMatches.push({ pageIndex, start: match.index, length: match[0].length });
      }
    });

    setMatches(newMatches);
    setSelectedMatchIndex(newMatches.length > 0 ? 0 : 0);
  }, [searchTerm, text]);

  // Scroll to current match (use container's .panel-content)
  useEffect(() => {
    if (matches.length === 0) return;
    const el = matchRefs.current[selectedMatchIndex];
    if (!el) return;

    const scrollContainer = containerRef.current?.querySelector(".panel-content");
    if (!scrollContainer) {
      // fallback to top-level container scroll
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Compute scroll top so the match is centered within the visible panel-content
    const elTop = el.getBoundingClientRect().top;
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const offset = elTop - containerTop + scrollContainer.scrollTop - scrollContainer.clientHeight / 2 + el.offsetHeight / 2;

    scrollContainer.scrollTo({ top: offset, behavior: "smooth" });
  }, [selectedMatchIndex, matches]);

  // Highlight search
  const highlightPage = (pageText, pageIndex) => {
    if (!searchTerm) return pageText;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    let matchCounter = 0;

    return pageText.split(regex).map((part, i) => {
      if (regex.test(part)) {
        while (
          matches[matchCounter] &&
          matches[matchCounter].pageIndex !== pageIndex
        ) {
          matchCounter++;
        }
        const globalIndex = matchCounter;
        const isSelected = selectedMatchIndex === globalIndex;
        matchCounter++;

        return (
          <mark
            key={i}
            ref={(el) => (matchRefs.current[globalIndex] = el)}
            className={isSelected ? "highlight-selected" : "highlight"}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.2));

  // Fit to page: compute scale so page fits into panel-content width with some padding
  const handleFitPage = () => {
    const scrollContainer = containerRef.current?.querySelector(".panel-content");
    if (!scrollContainer || !pageRefs.current[0]) return;
    const containerWidth = scrollContainer.clientWidth;
    const scale = (containerWidth * 0.9) / BASE_WIDTH; // fit 90% width
    const roundedScale = Math.round(scale * 10) / 10; // round to nearest 0.1 (10%)
    setZoom(roundedScale);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
      onClose();
    }, 300);
  };

  if (!file) return null;

  return (
    <div className={`text-viewer-container ${isOpen ? "open" : ""} ${isClosing ? "closing" : ""}`}>
      <div className="text-viewer-body two-column-layout">
        {/* Left: Text viewer */}
        <div className="viewer-panel" ref={containerRef}>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (matches.length > 0) {
                      setSelectedMatchIndex((prev) => (prev + 1) % matches.length);
                    }
                  }
                }}
              />

              <button className="fit-page-btn" onClick={handleFitPage}>Fit Page</button>

              {matches.length > 0 && (
                <span className="search-counter">
                  {selectedMatchIndex + 1}/{matches.length} results
                </span>
              )}
            </div>
          </div>

          <div className="panel-content text-only">
            {loadingText ? (
              <div className="text-viewer-loading">Loading text...</div>
            ) : (
              <div className="text-pages">
                {textPages.map((page, i) => {
                  // scaled dimensions
                  const pageWidth = Math.round(BASE_WIDTH * zoom);
                  const pageHeight = Math.round(BASE_HEIGHT * zoom);
                  return (
                    <div
                      key={i}
                      ref={(el) => (pageRefs.current[i] = el)}
                      className="page-wrapper"
                      style={{ marginBottom: 20 }} // fixed gap between pages
                    >
                      <div
                        className="text-page a4-page"
                        style={{
                          width: `${pageWidth}px`,
                          height: `${pageHeight}px`,
                        }}
                      >
                        <div
                          className="page-content"
                          style={{ fontSize: `${Math.round(14 * zoom)}px` }}
                        >
                          {highlightPage(page, i)}
                        </div>

                        <div className="page-number">Page {i + 1}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tags */}
        <div className="tags-panel">
          <div className="panel-header right-header">
            <h3 className="document-title">{file.originalName || file.filename}</h3>
            <button className="text-viewer-close-btn" onClick={handleClose}>×</button>
          </div>
        </div>
      </div>
    </div>
  );
}