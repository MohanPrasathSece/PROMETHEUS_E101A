import { collection, doc, getDocs, setDoc, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { model } from '../config/gemini';
import { WorkInsight, WorkThread } from '../types';
import { WorkThreadService } from './thread.service';

const INSIGHTS_COLLECTION = 'workInsights';

export class InsightService {
    /**
     * Generate insights for a user using AI
     */
    static async generateInsights(userId: string): Promise<WorkInsight[]> {
        const threads = await WorkThreadService.getUserThreads(userId);
        const insights: WorkInsight[] = [];

        // Check for ignored work
        const ignoredThreads = threads.filter(t => t.isIgnored && t.deadline);
        for (const thread of ignoredThreads) {
            if (thread.deadline) {
                const daysUntilDeadline = Math.ceil((thread.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                if (daysUntilDeadline <= 3) {
                    const insight = await this.createInsight({
                        userId,
                        type: 'ignored-work',
                        title: `${thread.title} needs attention`,
                        description: `This work thread has a deadline in ${daysUntilDeadline} days but has been marked as ignored.`,
                        severity: daysUntilDeadline <= 1 ? 'critical' : 'warning',
                        relatedThreadIds: [thread.id],
                        actionSuggestion: `Consider unblocking time to work on this before the deadline.`,
                        detectedAt: new Date(),
                        isActive: true,
                    });
                    insights.push(insight);
                }
            }
        }

        // Check for deadline risks
        const activeThreads = threads.filter(t => !t.isIgnored && t.deadline);
        for (const thread of activeThreads) {
            if (thread.deadline) {
                const daysUntilDeadline = Math.ceil((thread.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const progressPerDay = thread.progress / Math.max(1, Math.ceil((Date.now() - thread.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                const requiredProgressPerDay = (100 - thread.progress) / Math.max(1, daysUntilDeadline);

                if (requiredProgressPerDay > progressPerDay * 1.5 && thread.progress < 80) {
                    const insight = await this.createInsight({
                        userId,
                        type: 'deadline-risk',
                        title: `${thread.title} at risk`,
                        description: `With current progress rate (${progressPerDay.toFixed(1)}% per day), you may not complete this before the deadline.`,
                        severity: 'critical',
                        relatedThreadIds: [thread.id],
                        actionSuggestion: `Block ${Math.ceil((100 - thread.progress) / 10)} hours of focus time to address this.`,
                        detectedAt: new Date(),
                        isActive: true,
                    });
                    insights.push(insight);
                }
            }
        }

        // Use Gemini AI for additional insights
        try {
            const threadsContext = threads.map(t => ({
                title: t.title,
                priority: t.priority,
                progress: t.progress,
                deadline: t.deadline?.toISOString(),
            }));

            const prompt = `Analyze these work threads and provide ONE actionable insight about work patterns or productivity:
${JSON.stringify(threadsContext, null, 2)}

Respond in JSON format:
{
  "type": "attention-leak" | "overload" | "momentum-drift",
  "title": "Brief title",
  "description": "Detailed description",
  "severity": "info" | "warning" | "critical",
  "actionSuggestion": "Specific action to take"
}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiInsight = JSON.parse(jsonMatch[0]);
                const insight = await this.createInsight({
                    userId,
                    type: aiInsight.type,
                    title: aiInsight.title,
                    description: aiInsight.description,
                    severity: aiInsight.severity,
                    actionSuggestion: aiInsight.actionSuggestion,
                    detectedAt: new Date(),
                    isActive: true,
                });
                insights.push(insight);
            }
        } catch (error) {
            console.error('Error generating AI insights:', error);
        }

        return insights;
    }

    /**
     * Create a new insight
     */
    static async createInsight(insight: Omit<WorkInsight, 'id'>): Promise<WorkInsight> {
        const insightRef = doc(collection(db, INSIGHTS_COLLECTION));
        const newInsight: WorkInsight = {
            ...insight,
            id: insightRef.id,
        };

        await setDoc(insightRef, {
            ...newInsight,
            detectedAt: Timestamp.fromDate(newInsight.detectedAt),
        });

        return newInsight;
    }

    /**
     * Get active insights for a user
     */
    static async getActiveInsights(userId: string): Promise<WorkInsight[]> {
        const q = query(
            collection(db, INSIGHTS_COLLECTION),
            where('userId', '==', userId),
            where('isActive', '==', true),
            where('isDismissed', '!=', true),
            orderBy('detectedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocToInsight(doc));
    }

    /**
     * Dismiss an insight
     */
    static async dismissInsight(insightId: string): Promise<void> {
        const insightRef = doc(db, INSIGHTS_COLLECTION, insightId);
        await setDoc(insightRef, { isDismissed: true }, { merge: true });
    }

    /**
     * Delete old insights (cleanup)
     */
    static async deleteOldInsights(userId: string, daysOld: number = 30): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const q = query(
            collection(db, INSIGHTS_COLLECTION),
            where('userId', '==', userId),
            where('detectedAt', '<', Timestamp.fromDate(cutoffDate))
        );

        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    }

    /**
     * Helper to map Firestore document to WorkInsight
     */
    private static mapDocToInsight(doc: any): WorkInsight {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            description: data.description,
            severity: data.severity,
            relatedThreadIds: data.relatedThreadIds || [],
            actionSuggestion: data.actionSuggestion,
            detectedAt: data.detectedAt.toDate(),
            isActive: data.isActive,
            isDismissed: data.isDismissed || false,
        };
    }
}
