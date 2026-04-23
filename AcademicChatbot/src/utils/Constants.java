package utils;

/**
 * Central configuration class for the AI Academic Chatbot.
 * Contains API keys, endpoints, and application constraints.
 *
 * @author Expert Java Developer
 * @version 1.0.0
 */
public class Constants {

    /**
     * Google Gemini API Key.
     * Replace with your actual key from Google AI Studio.
     */
    public static final String GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

    /**
     * Gemini 1.5 Flash REST API endpoint.
     */
    public static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    /**
     * Maximum number of previous turn-pairs to keep for conversation context.
     */
    public static final int MAX_CONTEXT_HISTORY = 3;

    /**
     * Maximum characters of PDF text to send to Gemini as context (to stay within token limits/speed).
     */
    public static final int MAX_PDF_CONTEXT_CHARS = 3000;

    /**
     * Minimum number of keyword matches required to consider a PDF sentence relevant.
     */
    public static final int PDF_RELEVANCE_THRESHOLD = 2;

    /**
     * Main application title for the Swing window.
     */
    public static final String APP_TITLE = "AI Academic Chatbot";

    /**
     * Application version number.
     */
    public static final String VERSION = "1.0.0";
}
