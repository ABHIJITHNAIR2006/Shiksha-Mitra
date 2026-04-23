package chatbot;

import pdf.PDFReader;
import utils.Constants;
import utils.KeywordFallback;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Orchestrates the chatbot logic: PDF searching, AI calling, and fallback management.
 *
 * @author Expert Java Developer
 */
public class ChatbotEngine {

    private final ContextManager contextManager;

    /**
     * Stopwords to ignore during keyword matching in PDF.
     */
    private static final Set<String> STOPWORDS = new HashSet<>(Arrays.asList(
        "what", "is", "the", "a", "an", "how", "why", "when", "where", "who", "does", "do",
        "are", "was", "were", "explain", "define", "describe", "tell", "me", "about", "in",
        "of", "to", "and", "or", "for", "it", "with", "from", "at"
    ));

    public ChatbotEngine() {
        this.contextManager = new ContextManager();
    }

    /**
     * Processes a user question and determines the best source for an answer.
     *
     * @param userInput The student's query.
     * @return A prefixed answer (PDF, Gemini, or Fallback).
     */
    public String processQuery(String userInput) {
        String input = userInput.trim();
        if (input.isEmpty()) {
            return "Please enter a question.";
        }

        String answer = "";
        String answerSource = "";
        boolean pdfAnswered = false;

        // 1. Try local PDF Search first if PDF is loaded
        if (contextManager.hasPdfContent()) {
            String pdfRelevantSection = findRelevantPDFSection(input, contextManager.getPdfContent());
            if (pdfRelevantSection != null && !pdfRelevantSection.isEmpty()) {
                pdfAnswered = true;
                answerSource = "[PDF ANSWER from: " + contextManager.getPdfFileName() + "]";
                answer = pdfRelevantSection;
            }
        }

        // 2. If not found in PDF, ask Gemini AI
        if (!pdfAnswered) {
            try {
                String pdfCtx = contextManager.hasPdfContent()
                        ? PDFReader.truncateForContext(contextManager.getPdfContent(), Constants.MAX_PDF_CONTEXT_CHARS)
                        : "";
                
                answer = GeminiService.askGemini(input, pdfCtx, contextManager.getConversationContext());
                answerSource = "[GEMINI ANSWER]";
            } catch (Exception e) {
                // 3. Last resort: Offline Fallback
                answer = KeywordFallback.getResponse(input);
                answerSource = "[FALLBACK ANSWER — API unavailable]";
            }
        }

        // Add to history
        contextManager.addUserQuery(input);

        return answerSource + "\n\n" + answer;
    }

    /**
     * Searches the PDF text for a relevant sentence based on query keywords.
     *
     * @param query   The user's query.
     * @param pdfText The full text of the PDF.
     * @return A relevant snippet or null if no threshold met.
     */
    private String findRelevantPDFSection(String query, String pdfText) {
        // Tokenize query and filter keywords
        String[] tokens = query.toLowerCase().replaceAll("[^a-zA-Z\\s]", "").split("\\s+");
        Set<String> keywords = new HashSet<>();
        for (String t : tokens) {
            if (!STOPWORDS.contains(t) && t.length() > 2) {
                keywords.add(t);
            }
        }

        if (keywords.isEmpty()) return null;

        // Split text into sentences (approximate)
        String[] sentences = pdfText.split("(\\.\\s+)|(\\.\\n)");
        int maxMatches = 0;
        int bestIndex = -1;

        for (int i = 0; i < sentences.length; i++) {
            String sentenceLower = sentences[i].toLowerCase();
            int currentMatches = 0;
            for (String kw : keywords) {
                if (sentenceLower.contains(kw)) {
                    currentMatches++;
                }
            }

            if (currentMatches > maxMatches) {
                maxMatches = currentMatches;
                bestIndex = i;
            }
        }

        // Check if relevance threshold met
        if (maxMatches >= Constants.PDF_RELEVANCE_THRESHOLD) {
            // Build a window of 4 sentences total for context
            int start = Math.max(0, bestIndex - 1);
            int end = Math.min(sentences.length - 1, bestIndex + 2);
            
            StringBuilder result = new StringBuilder();
            for (int k = start; k <= end; k++) {
                result.append(sentences[k].trim()).append(". ");
            }
            return result.toString().trim();
        }

        return null; // No relevant section found
    }

    /**
     * Loads a PDF file and stores its content in context.
     *
     * @param filePath Full system path to the PDF.
     * @return true if loaded successfully.
     */
    public boolean loadPDF(String filePath) {
        try {
            String text = PDFReader.extractText(filePath);
            String fileName = new File(filePath).getName();
            contextManager.setPdfContent(text, fileName);
            return true;
        } catch (IOException e) {
            throw new RuntimeException("Failed to load PDF: " + e.getMessage(), e);
        }
    }

    public void clearPDF() {
        contextManager.clearPdfContent();
    }

    public void clearHistory() {
        contextManager.clearHistory();
    }

    public boolean hasPDF() {
        return contextManager.hasPdfContent();
    }

    public String getPDFFileName() {
        return contextManager.getPdfFileName();
    }

    public ContextManager getContextManager() {
        return contextManager;
    }
}
