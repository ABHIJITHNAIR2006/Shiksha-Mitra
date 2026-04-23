package utils;

import java.util.HashMap;
import java.util.Map;

/**
 * Offline fallback responder for basic academic keywords.
 * Triggered when the AI API is unreachable.
 *
 * @author Expert Java Developer
 */
public class KeywordFallback {

    private static final Map<String, String> RESPONSES = new HashMap<>();

    static {
        // Mathematics
        RESPONSES.put("calculus", "Calculus is the mathematical study of continuous change, involving derivatives and integrals.");
        RESPONSES.put("algebra", "Algebra focuses on symbols and the rules for manipulating those symbols in equations.");
        RESPONSES.put("trigonometry", "Trigonometry studies the relationships between the sides and angles of triangles.");
        RESPONSES.put("statistics", "Statistics is the science of collecting, analyzing, presenting, and interpreting data.");
        RESPONSES.put("matrices", "A matrix is a rectangular array of numbers arranged in rows and columns.");

        // Physics
        RESPONSES.put("newton", "Newton's laws of motion describe the relationship between a body and the forces acting upon it.");
        RESPONSES.put("gravity", "Gravity is the force by which a planet or other body draws objects toward its center.");
        RESPONSES.put("thermodynamics", "Thermodynamics deals with heat, work, temperature, and their relation to energy.");
        RESPONSES.put("quantum", "Quantum mechanics is a fundamental theory in physics that describes the physical properties of nature at the scale of atoms.");
        RESPONSES.put("relativity", "Einstein's theory of relativity encompasses special relativity and general relativity.");

        // Chemistry
        RESPONSES.put("periodic table", "The periodic table is a tabular display of chemical elements arranged by atomic number.");
        RESPONSES.put("bonds", "Chemical bonds are the forces that hold atoms together to form molecules.");
        RESPONSES.put("reactions", "A chemical reaction is a process that leads to the chemical transformation of one set of substances to another.");
        RESPONSES.put("acids", "Acids are substances that provide hydrogen ions (H+) or donate a proton.");
        RESPONSES.put("bases", "Bases are substances that accept protons or provide hydroxide ions (OH-).");

        // Computer Science
        RESPONSES.put("algorithm", "An algorithm is a finite sequence of well-defined instructions to solve a specific problem.");
        RESPONSES.put("data structure", "A data structure is a specialized format for organizing, processing, and storing data.");
        RESPONSES.put("recursion", "Recursion in CS is a method of solving a problem where the solution depends on solutions to smaller instances.");
        RESPONSES.put("oop", "Object-Oriented Programming (OOP) is based on the concept of 'objects' containing data and code.");
        RESPONSES.put("sorting", "Sorting algorithms are used to rearrange a list of elements into a specific order (e.g., numerical or alphabetical).");

        // Biology
        RESPONSES.put("cell", "The cell is the basic structural, functional, and biological unit of all known organisms.");
        RESPONSES.put("dna", "DNA (Deoxyribonucleic acid) is a molecule that carries genetic instructions for development and functioning.");
        RESPONSES.put("evolution", "Evolution is the change in the heritable characteristics of biological populations over successive generations.");
        RESPONSES.put("photosynthesis", "Photosynthesis is the process used by plants to convert light energy into chemical energy.");
        RESPONSES.put("ecosystem", "An ecosystem is a community of living organisms in conjunction with the nonliving components of their environment.");

        // General Study Tips
        RESPONSES.put("exam", "To prepare for exams, create a study schedule, practice past papers, and ensure good sleep.");
        RESPONSES.put("notes", "Effective note-taking involves summarizing key concepts and using visual aids like mind maps.");
        RESPONSES.put("study", "Consistent, focused study sessions are more effective than cramming at the last minute.");
        RESPONSES.put("assignment", "Break your assignments into smaller tasks and set early deadlines for yourself.");
        RESPONSES.put("deadline", "Stay organized with a calendar to avoid the stress of approaching deadlines.");
    }

    /**
     * Returns a fallback response based on keywords in user input.
     *
     * @param userInput The raw input from the student.
     * @return A static academic response or a default message.
     */
    public static String getResponse(String userInput) {
        String inputLower = userInput.toLowerCase();
        
        for (Map.Entry<String, String> entry : RESPONSES.entrySet()) {
            if (inputLower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return "I'm sorry, I couldn't find information on that topic in my fallback database. " +
               "Please check your internet connection to use the Gemini AI feature for broader questions.";
    }
}
