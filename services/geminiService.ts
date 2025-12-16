import { GoogleGenAI } from "@google/genai";
import { ActionCategory } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'MISSING_API_KEY' });

/**
 * Classifies the user's sustainability action input into one of three categories.
 * This ensures the subsequent feedback is relevant without generating unstable text.
 */
export const classifyUserAction = async (inputText: string): Promise<ActionCategory> => {
  if (!inputText || inputText.trim().length === 0) return 'NONE';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a classification system for a sustainability experiment.
        Analyze the following user input about their potential sustainable actions.
        
        Rules:
        1. If it mentions cups, bags, bottles, recycling, plastic reduction -> Return "REUSE"
        2. If it mentions walking, cycling, bus, mrt, public transport, driving less -> Return "TRANSPORT"
        3. If it is empty, says "no", "don't know", "nothing", or is irrelevant -> Return "NONE"
        4. Return ONLY the category word. No other text.

        User Input: "${inputText}"
      `,
    });

    const text = response.text?.trim().toUpperCase();

    if (text === 'REUSE') return 'REUSE';
    if (text === 'TRANSPORT') return 'TRANSPORT';
    
    return 'NONE';
  } catch (error) {
    console.error("Gemini Classification Error:", error);
    // Fallback safely to NONE if API fails to ensure experiment continuity
    return 'NONE';
  }
};