import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const askGemini = async (model, userPrompt, systemPrompt) => {
  try {
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt
    });

    const result = await generativeModel.generateContent(userPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
};
