import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// Initialize APIs
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
// Use gemini-1.5-flash which is the standard now, or fallback to gemini-pro
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

/**
 * Intelligent wrapper that chooses the best available free AI service.
 * Prioritizes Groq (Llama 3) if available, falls back to Gemini 1.5 Flash, 
 * and uses Pollinations.ai (No key required) as a final safety fallback.
 */
const model = {
    generateContent: async (prompt: string) => {
        console.log("AI Generation started...");

        // 1. Try Groq
        if (groq) {
            try {
                console.log("Trying Groq...");
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.1-8b-instant",
                });
                const text = completion.choices[0]?.message?.content || "";
                console.log("Groq success");
                return { response: { text: () => text } };
            } catch (e: any) {
                console.error("Groq generation failed:", e.message);
            }
        }

        // 2. Try Gemini
        if (geminiModel) {
            try {
                console.log("Trying Gemini...");
                const result = await geminiModel.generateContent(prompt);
                console.log("Gemini success");
                return result;
            } catch (e: any) {
                console.error("Gemini generation failed, trying gemini-pro...");
                try {
                    const fallbackModel = genAI!.getGenerativeModel({ model: "gemini-pro" });
                    const result = await fallbackModel.generateContent(prompt);
                    console.log("Gemini Pro success");
                    return result;
                } catch (e2: any) {
                    console.error("Gemini Pro generation failed:", e2.message);
                }
            }
        }

        // 3. Last Resort: Pollinations.ai (Increased timeout)
        try {
            console.log("Using Pollinations.ai fallback...");
            const safePrompt = encodeURIComponent(prompt.slice(0, 1000));
            // Use a longer timeout for Pollinations as it can be slow
            const response = await axios.get(`https://text.pollinations.ai/${safePrompt}?model=openai&system=MonocleAI`, { timeout: 30000 });
            const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            console.log("Pollinations success");
            return { response: { text: () => text } };
        } catch (e: any) {
            console.error("All AI fallbacks failed:", e.message);
            // Return a mock response instead of hard failing to keep app running
            console.warn("Returning dummy AI response to avoid crash.");
            return { response: { text: () => "I'm currently having trouble reaching my AI services. Please check back in a moment or verify your internet connection. (Fallback Mode)" } };
        }
    },

    startChat: (config: { history: any[] }) => {
        const history = config.history || [];

        return {
            sendMessage: async (message: string) => {
                console.log("Chat sendMessage started...");

                // 1. Groq Chat
                if (groq) {
                    try {
                        console.log("Trying Groq Chat...");
                        const messages = [
                            ...history.map((h: any) => ({
                                role: (h.role === "user") ? "user" : "assistant",
                                content: h.parts?.[0]?.text || h.content || "",
                            })),
                            { role: "user", content: message },
                        ];
                        const completion = await groq.chat.completions.create({
                            messages: messages as any,
                            model: "llama-3.1-70b-versatile",
                        });
                        const text = completion.choices[0]?.message?.content || "";
                        console.log("Groq Chat success");
                        return { response: { text: () => text } };
                    } catch (e: any) {
                        console.error("Groq chat failed:", e.message);
                    }
                }

                // 2. Gemini Chat
                if (genAI) {
                    try {
                        console.log("Trying Gemini Chat...");
                        const chat = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).startChat({
                            history: history.map(h => ({
                                role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
                                parts: h.parts || [{ text: h.content }]
                            })),
                        });
                        const result = await chat.sendMessage(message);
                        console.log("Gemini Chat success");
                        return result;
                    } catch (e: any) {
                        console.error("Gemini chat failed, trying gemini-pro chat...");
                        try {
                            const chat = genAI!.getGenerativeModel({ model: "gemini-pro" }).startChat({
                                history: history.map(h => ({
                                    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
                                    parts: h.parts || [{ text: h.content }]
                                })),
                            });
                            const result = await chat.sendMessage(message);
                            console.log("Gemini Pro Chat success");
                            return result;
                        } catch (e2: any) {
                            console.error("Gemini Pro chat failed:", e2.message);
                        }
                    }
                }

                // 3. Pollinations Fallback for Chat
                try {
                    console.log("Using Pollinations Chat fallback...");
                    const safeMsg = encodeURIComponent(message.slice(0, 500));
                    const response = await axios.get(`https://text.pollinations.ai/${safeMsg}?model=openai&system=MonocleAI`, { timeout: 30000 });
                    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
                    console.log("Pollinations Chat success");
                    return { response: { text: () => text } };
                } catch (e: any) {
                    console.error("Pollinations chat failed:", e.message);
                    return { response: { text: () => "I'm sorry, I'm unable to connect to my AI services right now. Please check your internet connection." } };
                }
            },
        };
    },
};

export { model };
