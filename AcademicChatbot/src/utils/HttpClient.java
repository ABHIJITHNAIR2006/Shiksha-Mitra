package utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Utility class for handling HTTP POST requests using HttpURLConnection.
 * Designed for standard Java SE environments without external HTTP libraries.
 *
 * @author Expert Java Developer
 */
public class HttpClient {

    /**
     * Sends a POST request to the specified URL with a JSON body.
     *
     * @param urlString The endpoint URL.
     * @param jsonBody  The JSON payload to send.
     * @return The response body as a String.
     * @throws Exception If a network or protocol error occurs.
     */
    public static String post(String urlString, String jsonBody) throws Exception {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        OutputStreamWriter writer = null;

        try {
            // Initialize connection
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000); // 30 seconds
            conn.setReadTimeout(30000);    // 30 seconds

            // Set Headers
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");

            // Write Request Body
            writer = new OutputStreamWriter(conn.getOutputStream());
            writer.write(jsonBody);
            writer.flush();

            // Check Response Code
            int responseCode = conn.getResponseCode();
            
            // Read Response
            StringBuilder response = new StringBuilder();
            if (responseCode >= 400) {
                // Read from error stream if failed
                reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                throw new Exception("HTTP Error " + responseCode + ": " + response.toString());
            } else {
                // Read from input stream if success
                reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
            }

            return response.toString();

        } finally {
            // Close all resources in finally block to avoid leaks
            if (writer != null) {
                try { writer.close(); } catch (Exception e) { /* Ignore */ }
            }
            if (reader != null) {
                try { reader.close(); } catch (Exception e) { /* Ignore */ }
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
