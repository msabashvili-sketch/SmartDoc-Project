import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry"; // PDF worker

export default function PdfViewer({ fileUrl }) {
  const canvasRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!fileUrl) return;

    const loadingTask = pdfjsLib.getDocument(fileUrl);
    loadingTask.promise.then(
      pdf => {
        setNumPages(pdf.numPages);
        renderPage(pdf, currentPage);
      },
      err => {
        console.error("Error loading PDF:", err);
      }
    );

    function renderPage(pdf, pageNumber) {
      pdf.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        page.render(renderContext);
      });
    }

    const handlePageChange = (delta) => {
      const nextPage = currentPage + delta;
      if (nextPage < 1 || nextPage > numPages) return;
      setCurrentPage(nextPage);
      loadingTask.promise.then(pdf => renderPage(pdf, nextPage));
    };

    // Optional: add keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handlePageChange(1);
      if (e.key === "ArrowLeft") handlePageChange(-1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);

  }, [fileUrl, currentPage, numPages]);

  if (!fileUrl) return null;

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ border: "1px solid #ccc", margin: "10px auto" }} />
      {numPages > 1 && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => currentPage < numPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === numPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}