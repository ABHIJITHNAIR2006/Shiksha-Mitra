package chatbot;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

/**
 * Manages conversation history and active PDF content.
 * Implements a rolling window for history to manage context window size.
 *
 * @author Expert Java Developer
 */
public class ContextManager {

    private final LinkedList<String> conversationHistory;
    private String pdfContent = "";
    private String pdfFileName = "";

    /**
     * Initializes the context manager with an empty history.
     */
    public ContextManager() {
        this.conversationHistory = new LinkedList<>();
    }

    /**
     * Adds a user query to the history. Maintains a rolling window.
     *
     * @param query The student's question.
     */
    public void addUserQuery(String query) {
        conversationHistory.add(query);
        if (conversationHistory.size() > utils.Constants.MAX_CONTEXT_HISTORY) {
            conversationHistory.removeFirst(); // Remove oldest
        }
    }

    /**
     * Formats the conversation history for inclusion in the AI prompt.
     *
     * @return Formatted conversation history string.
     */
    public String getConversationContext() {
        if (conversationHistory.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("Previous conversation history:\n");
        for (String msg : conversationHistory) {
            sb.append("User: ").append(msg).append("\n");
        }
        return sb.toString();
    }

    /**
     * Updates the PDF content and file name associated with the engine.
     *
     * @param content  Extracted text.
     * @param fileName Name of the source file.
     */
    public void setPdfContent(String content, String fileName) {
        this.pdfContent = content;
        this.pdfFileName = fileName;
    }

    public String getPdfContent() {
        return pdfContent;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public boolean hasPdfContent() {
        return pdfContent != null && !pdfContent.isEmpty();
    }

    /**
     * Clears current PDF context.
     */
    public void clearPdfContent() {
        this.pdfContent = "";
        this.pdfFileName = "";
    }

    /**
     * Clears all conversation history.
     */
    public void clearHistory() {
        this.conversationHistory.clear();
    }

    /**
     * Returns an unmodifiable list of the conversation history.
     *
     * @return List of past queries.
     */
    public List<String> getHistory() {
        return Collections.unmodifiableList(conversationHistory);
    }
}
