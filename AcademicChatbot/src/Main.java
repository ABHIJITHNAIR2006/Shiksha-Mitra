import ui.ChatWindow;
import utils.Constants;

import javax.swing.SwingUtilities;

/**
 * Main entry point for the AI Academic Chatbot.
 * Validates prerequisites and launches the graphical interface.
 *
 * @author Expert Java Developer
 */
public class Main {

    public static void main(String[] args) {
        // Console banner for logging purposes
        System.out.println(" ╔══════════════════════════════════════╗");
        System.out.println(" ║   AI Academic Chatbot v1.0           ║");
        System.out.println(" ║   Powered by Gemini AI + PDFBox      ║");
        System.out.println(" ╚══════════════════════════════════════╝");

        // Validate API Key Placeholder
        if (Constants.GEMINI_API_KEY.equals("YOUR_GEMINI_API_KEY_HERE")) {
            System.err.println("⚠ WARNING: Gemini API key not found in Constants.java.");
            System.err.println("   The application will run, but will use Fallback Keyword mode");
            System.err.println("   for AI queries until an API key is provided.");
        } else {
            System.out.println("ℹ Gemini API Key detected. AI features active.");
        }

        // Launch UI on Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            try {
                // Set Look and Feel to System default for better appearance
                // javax.swing.UIManager.setLookAndFeel(javax.swing.UIManager.getSystemLookAndFeelClassName());
                new ChatWindow();
            } catch (Exception e) {
                System.err.println("CRITICAL ERROR: Failed to launch UI.");
                e.printStackTrace();
            }
        });
    }
}
