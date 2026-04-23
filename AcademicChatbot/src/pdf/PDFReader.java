package pdf;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;

/**
 * Handles extraction of text from PDF documents using Apache PDFBox.
 *
 * @author Expert Java Developer
 */
public class PDFReader {

    /**
     * Extracts text from a PDF file located at the given path.
     *
     * @param filePath Path to the PDF file.
     * @return Extracted and trimmed text.
     * @throws IOException If file is missing, unreadable, or invalid.
     */
    public static String extractText(String filePath) throws IOException {
        File file = new File(filePath);

        // Validation
        if (!file.exists()) {
            throw new IOException("File not found: " + filePath);
        }
        if (!file.canRead()) {
            throw new IOException("Cannot read file: " + filePath);
        }
        if (!filePath.toLowerCase().endsWith(".pdf")) {
            throw new IOException("Invalid file type. Please provide a .pdf file.");
        }

        // Using try-with-resources for automatic closing of the document
        try (PDDocument document = Loader.loadPDF(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            if (text == null || text.trim().isEmpty()) {
                throw new IOException("PDF appears to be empty or scanned (no extractable text found).");
            }

            return text.trim();
        } catch (Exception e) {
            throw new IOException("Error processing PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Truncates text to a maximum character count for inclusion in AI context.
     *
     * @param text     The full text.
     * @param maxChars Maximum allowed characters.
     * @return Truncated text with a notice if truncation occurred.
     */
    public static String truncateForContext(String text, int maxChars) {
        if (text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars) + "\n... [PDF content truncated for context size limits]";
    }
}
