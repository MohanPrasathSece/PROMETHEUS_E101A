import { model } from '../config/gemini';
import { WorkThreadService } from './thread.service';
import { WorkItemService } from './workitem.service';
import { InsightService } from './insight.service';

export class ChatService {
    /**
     * Process a chat message from the user
     */
    static async processChat(userId: string, message: string, history: { role: 'user' | 'model', content: string }[] = []) {
        try {
            // Fetch user context for the AI
            const threads = await WorkThreadService.getUserThreads(userId);
            const insights = await InsightService.getActiveInsights(userId);

            const context = {
                threads: threads.map(t => ({
                    title: t.title,
                    priority: t.priority,
                    progress: t.progress,
                    deadline: t.deadline
                })),
                insights: insights.map(i => ({
                    title: i.title,
                    description: i.description,
                    severity: i.severity
                }))
            };

            const systemPrompt = `You are Monocle AI, a powerful work intelligence assistant. 
            You help users manage their work threads, insights, and productivity.
            
            USER CONTEXT:
            - Recent Threads: ${JSON.stringify(context.threads)}
            - Active Insights: ${JSON.stringify(context.insights)}
            
            GUIDELINES:
            1. Be concise, professional, and helpful.
            2. Use the provided context to answer questions about their work.
            3. If a user asks about their progress, refer to their threads.
            4. If a user is overloaded (high cognitive load), suggest focusing on one high-priority thread.
            5. You can suggest creating new threads or marking items as complete.
            
            Respond in Markdown format. Keep responses under 200 words unless detail is requested.`;

            const chatHistory = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Understood. I am Monocle AI, ready to assist you with your work intelligence. How can I help you today?' }]
                    },
                    ...chatHistory
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error in ChatService:', error);
            throw new Error('Failed to process chat message');
        }
    }
}
