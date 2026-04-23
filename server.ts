import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure multer for file uploads in memory
  const upload = multer({ storage: multer.memoryStorage() });

  /**
   * API Route: Extract text from PDF
   * This mimics the PDFReader logic in the Java project.
   */
  app.post("/api/extract-pdf", upload.single("pdf"), async (req, res) => {
    console.log("PDF Upload received:", req.file?.originalname);
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // Check if file is actually a PDF by looking at magic numbers
      const buffer = req.file.buffer;
      if (buffer.slice(0, 4).toString() !== '%PDF') {
         return res.status(400).json({ error: "Uploaded file is not a valid PDF document." });
      }

      console.log("Attempting extraction with PDFParse...");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text;

      if (!text || text.trim().length === 0) {
        console.warn("Extraction yielded no text.");
        return res.status(400).json({ error: "PDF appears to be empty or scanned (no extractable text found)." });
      }

      console.log(`Extraction successful. Length: ${text.length} chars.`);
      res.json({ 
        text: text.trim(),
        fileName: req.file.originalname,
        charCount: text.length
      });
    } catch (error: any) {
      console.error("PDF Extraction Error:", error);
      res.status(500).json({ error: "The PDF could not be read. It might be corrupt or password-protected: " + error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
