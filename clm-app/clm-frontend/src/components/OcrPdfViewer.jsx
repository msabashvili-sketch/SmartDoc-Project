import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const OcrPdfViewer = ({ fileId }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [numPages, setNumPages] = useState(null);

  // Load PDF blob from backend
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/files/${fileId}`);
        if (!res.ok) throw new Error("Failed to fetch PDF");
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("❌ Error loading PDF:", err);
      }
    };

    const fetchOcrText = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/text/${fileId}`);
        if (!res.ok) throw new Error("Failed to fetch OCR text");
        const data = await res.json();
        setOcrText(data.text || "");
      } catch (err) {
        console.error("❌ Error loading OCR text:", err);
      }
    };

    if (fileId) {
      fetchPdf();
      fetchOcrText();
    }
  }, [fileId]);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center overflow-auto">
      <div className="mt-4 mb-4 text-lg font-semibold text-gray-700">
        Document Preview
      </div>

      {pdfUrl ? (
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          className="shadow-lg bg-white"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="relative my-4">
              <Page pageNumber={index + 1} width={800} renderTextLayer={true} renderAnnotationLayer={true} />

              {/* OCR text overlay */}
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none select-text"
                style={{
                  color: "transparent",
                  whiteSpace: "pre-wrap",
                  fontFamily: "serif",
                  lineHeight: "1.5",
                  fontSize: "14px",
                  padding: "20px",
                  mixBlendMode: "multiply",
                }}
              >
                {ocrText}
              </div>
            </div>
          ))}
        </Document>
      ) : (
        <div className="mt-20 text-gray-600">Loading document...</div>
      )}
    </div>
  );
};

export default OcrPdfViewer;