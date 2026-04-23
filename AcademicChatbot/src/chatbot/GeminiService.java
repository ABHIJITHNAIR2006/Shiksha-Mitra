package chatbot;

import org.json.JSONArray;
import org.json.JSONObject;
import utils.Constants;
import utils.HttpClient;

/**
 * Service class to interact with the Google Gemini REST API.
 * Builds prompts and parses complex JSON responses.
 *
 * @author Expert Java Developer
 */
public class GeminiService {

    /**
     * Sends a prompt to the Gemini API incorporating PDF and conversation context.
     *
     * @param userQuestion        The current student question.
     * @param pdfContext          Truncated PDF content if available.
     * @param conversationContext Formatted previous history.
     * @return AI generated response text.
     * @throws Exception If API call or parsing fails.
     */
    public static String askGemini(String userQuestion, String pdfContext, String conversationContext) throws Exception {
        try {
            // Step 1: Build the mega-prompt
            StringBuilder promptBuilder = new StringBuilder();

            if (conversationContext != null && !conversationContext.isEmpty()) {
                promptBuilder.append(conversationContext).append("\n\n");
            }

            if (pdfContext != null && !pdfContext.isEmpty()) {
                promptBuilder.append("You have been given the following academic document as context:\n")
                        .append("--- DOCUMENT START ---\n")
                        .append(pdfContext)
                        .append("\n--- DOCUMENT END ---\n\n")
                        .append("Using the document above as your primary source, answer this question. ")
                        .append("If the answer is in the document, cite the relevant section. ")
                        .append("If the information is not in the document, answer using your general academic knowledge and explicitly state that it was not found in the document.\n\n");
            }

            promptBuilder.append("Student Question: ").append(userQuestion);

            // Step 2: Build JSON Request using org.json
            JSONObject requestBody = new JSONObject();
            JSONArray contents = new JSONArray();
            JSONObject content = new JSONObject();
            JSONArray parts = new JSONArray();
            JSONObject part = new JSONObject();

            part.put("text", promptBuilder.toString());
            parts.put(part);
            content.put("parts", parts);
            contents.put(content);
            requestBody.put("contents", contents);

            // Optional generation config
            JSONObject genConfig = new JSONObject();
            genConfig.put("temperature", 0.7);
            genConfig.put("maxOutputTokens", 1024);
            requestBody.put("generationConfig", genConfig);

            // Step 3: Append API key to URL
            String fullUrl = Constants.GEMINI_API_URL + "?key=" + Constants.GEMINI_API_KEY;

            // Step 4: Perform HTTP Call
            String responseString = HttpClient.post(fullUrl, requestBody.toString());

            // Step 5: Parse Response
            JSONObject responseJson = new JSONObject(responseString);
            
            // Navigate: candidates[0] -> content -> parts[0] -> text
            if (responseJson.has("candidates")) {
                JSONArray candidates = responseJson.getJSONArray("candidates");
                if (candidates.length() > 0) {
                    JSONObject firstCandidate = candidates.getJSONObject(0);
                    if (firstCandidate.has("content")) {
                        JSONObject resContent = firstCandidate.getJSONObject("content");
                        if (resContent.has("parts")) {
                            JSONArray resParts = resContent.getJSONArray("parts");
                            if (resParts.length() > 0) {
                                return resParts.getJSONObject(0).getString("text");
                            }
                        }
                    }
                }
            }

            throw new Exception("Unexpected response format from Gemini API: " + responseString);

        } catch (Exception e) {
            // Log and rethrow with context
            throw new Exception("Gemini API Error: " + e.getMessage());
        }
    }
}
