package ui;

import chatbot.ChatbotEngine;
import utils.Constants;

import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.io.File;

/**
 * Main Window for the AI Academic Chatbot application.
 * Handles user interaction, PDF loading, and asynchronous processing.
 *
 * @author Expert Java Developer
 */
public class ChatWindow extends JFrame {

    // UI Components
    private JTextArea chatArea;
    private JTextField inputField;
    private JButton sendButton;
    private JButton loadPdfButton;
    private JButton clearPdfButton;
    private JButton clearHistoryButton;
    private JLabel statusLabel;
    private JScrollPane scrollPane;

    // Logic Engine
    private ChatbotEngine engine;

    /**
     * Constructs and displays the ChatWindow.
     */
    public ChatWindow() {
        super(Constants.APP_TITLE + " v" + Constants.VERSION);
        this.engine = new ChatbotEngine();

        initializeComponents();
        setupLayout();
        setupEventListeners();

        // Frame Settings
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 650);
        setLocationRelativeTo(null); // Center on screen
        setVisible(true);

        // Display Welcome Message
        displayWelcome();
    }

    private void initializeComponents() {
        // Chat Display
        chatArea = new JTextArea();
        chatArea.setEditable(false);
        chatArea.setLineWrap(true);
        chatArea.setWrapStyleWord(true);
        chatArea.setFont(new Font("Monospaced", Font.PLAIN, 13));
        chatArea.setMargin(new Insets(10, 10, 10, 10));

        scrollPane = new JScrollPane(chatArea);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);

        // Input Field
        inputField = new JTextField();
        inputField.setFont(new Font("SansSerif", Font.PLAIN, 14));

        // Buttons
        sendButton = new JButton("Send ▶");
        sendButton.setBackground(new Color(0, 120, 215));
        sendButton.setForeground(Color.WHITE);
        sendButton.setFocusPainted(false);
        sendButton.setFont(new Font("SansSerif", Font.BOLD, 12));

        loadPdfButton = new JButton("📄 Load PDF");
        loadPdfButton.setBackground(new Color(34, 139, 34));
        loadPdfButton.setForeground(Color.WHITE);
        loadPdfButton.setFocusPainted(false);

        clearPdfButton = new JButton("🗑 Clear PDF");
        clearPdfButton.setBackground(new Color(178, 34, 34));
        clearPdfButton.setForeground(Color.WHITE);
        clearPdfButton.setFocusPainted(false);

        clearHistoryButton = new JButton("↺ Clear History");
        clearHistoryButton.setFocusPainted(false);

        // Labels
        statusLabel = new JLabel("  Status: No PDF loaded");
        statusLabel.setForeground(Color.DARK_GRAY);
        statusLabel.setFont(new Font("SansSerif", Font.ITALIC, 11));
    }

    private void setupLayout() {
        setLayout(new BorderLayout());

        // North Panel (Controls)
        JPanel northPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 10));
        northPanel.add(loadPdfButton);
        northPanel.add(clearPdfButton);
        northPanel.add(clearHistoryButton);
        northPanel.add(statusLabel);
        add(northPanel, BorderLayout.NORTH);

        // Center Panel (Chat)
        add(scrollPane, BorderLayout.CENTER);

        // South Panel (Input)
        JPanel southPanel = new JPanel(new BorderLayout(10, 10));
        southPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        southPanel.add(inputField, BorderLayout.CENTER);
        southPanel.add(sendButton, BorderLayout.EAST);
        add(southPanel, BorderLayout.SOUTH);
    }

    private void setupEventListeners() {
        // Send Button Action
        sendButton.addActionListener(e -> handleSendMessage());

        // Input Field (Enter Key)
        inputField.addActionListener(e -> handleSendMessage());

        // Load PDF Action
        loadPdfButton.addActionListener(e -> {
            JFileChooser fileChooser = new JFileChooser();
            fileChooser.setFileFilter(new FileNameExtensionFilter("PDF Documents", "pdf"));
            int result = fileChooser.showOpenDialog(this);

            if (result == JFileChooser.APPROVE_VALUE) {
                File selectedFile = fileChooser.getSelectedFile();
                statusLabel.setText("  Status: ⏳ Loading PDF...");
                
                // Load in background thread to avoid freezing UI
                new SwingWorker<Boolean, Void>() {
                    @Override
                    protected Boolean doInBackground() throws Exception {
                        return engine.loadPDF(selectedFile.getAbsolutePath());
                    }

                    @Override
                    protected void done() {
                        try {
                            if (get()) {
                                statusLabel.setText("  Status: ✅ PDF Loaded: " + selectedFile.getName());
                                appendToChat("\n[System] PDF Loaded Successfully: " + selectedFile.getName() + " (" + (selectedFile.length()/1024) + " KB)\n");
                            }
                        } catch (Exception ex) {
                            statusLabel.setText("  Status: ❌ Error loading PDF");
                            JOptionPane.showMessageDialog(ChatWindow.this, "Error: " + ex.getMessage(), "PDF Load Error", JOptionPane.ERROR_MESSAGE);
                        }
                    }
                }.execute();
            }
        });

        // Clear PDF Action
        clearPdfButton.addActionListener(e -> {
            engine.clearPDF();
            statusLabel.setText("  Status: No PDF loaded");
            appendToChat("\n[System] PDF context cleared. I will now answer using Gemini AI knowledge.\n");
        });

        // Clear History Action
        clearHistoryButton.addActionListener(e -> {
            engine.clearHistory();
            appendToChat("\n[System] Conversation history cleared. New session started.\n");
        });
    }

    private void handleSendMessage() {
        String userInput = inputField.getText().trim();
        if (userInput.isEmpty()) return;

        // Update UI
        appendToChat("\nYou: " + userInput + "\n");
        inputField.setText("");
        
        // Disable controls during thinking
        sendButton.setEnabled(false);
        inputField.setEnabled(false);
        appendToChat("Bot: 🤔 Thinking...");

        // Process in background
        new SwingWorker<String, Void>() {
            @Override
            protected String doInBackground() {
                return engine.processQuery(userInput);
            }

            @Override
            protected void done() {
                try {
                    String result = get();
                    // Remove "Thinking..." message (last line)
                    String currentText = chatArea.getText();
                    int lastIndex = currentText.lastIndexOf("Bot: 🤔 Thinking...");
                    if (lastIndex != -1) {
                        chatArea.setText(currentText.substring(0, lastIndex));
                    }

                    appendToChat("Bot: " + result + "\n");
                    appendToChat("──────────────────────────────────────────────────\n");
                    
                    // Re-enable and focus
                    sendButton.setEnabled(true);
                    inputField.setEnabled(true);
                    inputField.requestFocus();
                    scrollToBottom();
                } catch (Exception ex) {
                    appendToChat("\n[Error] Failed to get response: " + ex.getMessage() + "\n");
                    sendButton.setEnabled(true);
                    inputField.setEnabled(true);
                }
            }
        }.execute();
    }

    private void displayWelcome() {
        appendToChat("══════════════════════════════════════════════════\n");
        appendToChat("  Welcome to AI Academic Chatbot v1.0\n");
        appendToChat("  Powered by Google Gemini AI + PDF Understanding\n");
        appendToChat("══════════════════════════════════════════════════\n\n");
        appendToChat("HOW TO USE:\n");
        appendToChat("  1. Click 'Load PDF' to read study material\n");
        appendToChat("  2. Type your academic question below\n");
        appendToChat("  3. Press Send or hit Enter\n\n");
        appendToChat("  [PDF ANSWER]      = Direct extraction from your PDF\n");
        appendToChat("  [GEMINI ANSWER]   = Intelligent AI-based response\n");
        appendToChat("  [FALLBACK ANSWER] = Offline keyword-based library\n\n");
        appendToChat("Ready! Ask me anything.\n");
        appendToChat("──────────────────────────────────────────────────\n");
    }

    private void appendToChat(String text) {
        chatArea.append(text);
        scrollToBottom();
    }

    private void scrollToBottom() {
        chatArea.setCaretPosition(chatArea.getDocument().getLength());
    }
}
