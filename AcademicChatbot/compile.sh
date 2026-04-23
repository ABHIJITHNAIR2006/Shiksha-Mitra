#!/bin/bash
echo "========================================"
echo "  Compiling AI Academic Chatbot..."
echo "========================================"
mkdir -p out
javac -cp "lib/*:src" -d out src/utils/Constants.java src/utils/HttpClient.java src/utils/KeywordFallback.java src/pdf/PDFReader.java src/chatbot/ContextManager.java src/chatbot/GeminiService.java src/chatbot/ChatbotEngine.java src/ui/ChatWindow.java src/Main.java
if [ $? -eq 0 ]; then
    echo ""
    echo "[+] Compilation successful!"
    echo "[+] Output directory: out"
else
    echo ""
    echo "[!] Compilation failed."
fi
