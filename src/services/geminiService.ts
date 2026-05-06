import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface FareEstimate {
  fare: number;
  explanation: string;
  currency: string;
}

export async function estimateFare(distanceKm: number, durationMin: number, trafficLevel: string = "normal"): Promise<FareEstimate> {
  if (!process.env.GEMINI_API_KEY) {
    return { fare: distanceKm * 1.5 + durationMin * 0.5, explanation: "Fallback calculation (Mock)", currency: "USD" };
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Estimate a ride-share fare for a ${distanceKm}km trip taking ${durationMin} minutes with ${trafficLevel} traffic. Use competitive rates. Return ONLY JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fare: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          currency: { type: Type.STRING }
        },
        required: ["fare", "explanation", "currency"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as FareEstimate;
}
