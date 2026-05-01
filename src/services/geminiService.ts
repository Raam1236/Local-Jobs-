import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface JobDraft {
  title: string;
  description: string;
  category: string;
  suggestedPayment: string;
}

export const generateJobDraft = async (userInput: string): Promise<JobDraft> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Expand this hyperlocal daily wage job request into a professional job post details in JSON format. Input: "${userInput}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            suggestedPayment: { type: Type.STRING },
          },
          required: ["title", "description", "category", "suggestedPayment"],
        },
      },
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const detectFraud = async (jobData: any): Promise<{ isFraud: boolean; reason: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this daily wage job post for potential fraud or suspicious activity (e.g., asking for money upfront, suspicious payment, duplicate spam). Return JSON. Job: ${JSON.stringify(jobData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFraud: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: ["isFraud", "reason"],
        },
      },
    });

    if (!response.text) return { isFraud: false, reason: "" };
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Fraud Detection Error:", error);
    return { isFraud: false, reason: "" };
  }
};

export const suggestJobsForWorker = async (
  profile: { skills: string[]; bio: string },
  jobs: { id: string; title: string; category: string; description: string }[],
  applicationJobIds: string[]
): Promise<{ suggestedJobIds: string[]; reasoning: string }> => {
  try {
    const recentJobs = jobs.slice(0, 20); // Only analyze top 20 to save tokens
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a job matching expert. Analyze this worker profile and suggest 1-2 jobs they haven't applied to yet.
      Worker Profile: Skills: ${profile.skills.join(', ')}, Bio: ${profile.bio}
      Already Applied To Job IDs: ${applicationJobIds.join(', ')}
      Available Jobs List: ${JSON.stringify(recentJobs)}
      Return JSON with suggestedJobIds and a brief collective reasoning why these are good matches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedJobIds: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reasoning: { type: Type.STRING },
          },
          required: ["suggestedJobIds", "reasoning"],
        },
      },
    });

    if (!response.text) return { suggestedJobIds: [], reasoning: "" };
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return { suggestedJobIds: [], reasoning: "" };
  }
};
