@echo off
echo.
echo ========================================
echo   Compiling AI Academic Chatbot...
echo ========================================
echo.

if not exist out mkdir out

javac -cp "lib/*;src" -d out src/utils/Constants.java src/utils/HttpClient.java src/utils/KeywordFallback.java src/pdf/PDFReader.java src/chatbot/ContextManager.java src/chatbot/GeminiService.java src/chatbot/ChatbotEngine.java src/ui/ChatWindow.java src/Main.java

if %errorlevel% == 0 (
    echo.
    echo [+] Compilation successful!
    echo [+] Output directory: out
    echo.
) else (
    echo.
    echo [!] Compilation failed. Please check if lib/ jars are present.
    echo.
)
pause
