import { GoogleGenAI } from "@google/genai";

// CAUTION: In a real production app, never expose API keys on the client.
// This is for demonstration purposes adhering to the prompt requirements.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAsset = async (prompt: string, type: 'sprite' | 'background'): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key");
  }

  try {
    const modelId = 'gemini-2.5-flash-image';
    const finalPrompt = type === 'sprite' 
      ? `Pixel art sprite of a ${prompt}, white background, isolated, centered.` 
      : `Cartoon background scene of ${prompt}, vibrant colors, 4:3 aspect ratio.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: finalPrompt }]
      }
    });

    // Check for inline data in candidates by iterating through all parts
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned");

  } catch (error) {
    console.error("Gemini generation failed:", error);
    throw error;
  }
};