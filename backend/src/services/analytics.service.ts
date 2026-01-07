import { collection, doc, getDocs, setDoc, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CognitiveLoadState, DailyStats, Activity } from '../types';
import { WorkThreadService } from './thread.service';

const COGNITIVE_LOAD_COLLECTION = 'cognitiveLoad';
const DAILY_STATS_COLLECTION = 'dailyStats';
const ACTIVITIES_COLLECTION = 'activities';

export class AnalyticsService {
    /**
     * Calculate current cognitive load
     */
    static async calculateCognitiveLoad(userId: string): Promise<CognitiveLoadState> {
        const activeThreads = await WorkThreadService.getActiveThreads(userId);
        const recentActivities = await this.getRecentActivities(userId, 1); // Last 1 hour

        // Calculate context switches in the last hour
        const contextSwitches = recentActivities.filter(a => a.type === 'context-switch').length;

        // Calculate work duration today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayActivities = recentActivities.filter(a => a.timestamp >= todayStart);
        const workDuration = todayActivities.length > 0
            ? (Date.now() - todayActivities[0].timestamp.getTime()) / (1000 * 60 * 60)
            : 0;

        // Count pending deadlines in next 7 days
        const upcomingDeadlines = await WorkThreadService.getThreadsWithUpcomingDeadlines(userId, 7);

        const factors = {
            activeThreads: activeThreads.length,
            switchingFrequency: contextSwitches,
            workDuration,
            pendingDeadlines: upcomingDeadlines.length,
        };

        // Calculate score (0-100)
        let score = 0;
        score += Math.min(30, activeThreads.length * 5); // Max 30 points
        score += Math.min(30, contextSwitches * 3); // Max 30 points
        score += Math.min(20, workDuration * 2.5); // Max 20 points
        score += Math.min(20, upcomingDeadlines.length * 4); // Max 20 points

        // Determine level
        let level: 'low' | 'medium' | 'high' | 'critical';
        if (score < 25) level = 'low';
        else if (score < 50) level = 'medium';
        else if (score < 75) level = 'high';
        else level = 'critical';

        const cognitiveLoad: CognitiveLoadState = {
            id: `${userId}_${Date.now()}`,
            userId,
            level,
            score,
            factors,
            timestamp: new Date(),
        };

        await this.saveCognitiveLoad(cognitiveLoad);
        return cognitiveLoad;
    }

    /**
     * Save cognitive load state
     */
    static async saveCognitiveLoad(load: CognitiveLoadState): Promise<void> {
        const loadRef = doc(collection(db, COGNITIVE_LOAD_COLLECTION));
        await setDoc(loadRef, {
            ...load,
            timestamp: Timestamp.fromDate(load.timestamp),
        });
    }

    /**
     * Get latest cognitive load
     */
    static async getLatestCognitiveLoad(userId: string): Promise<CognitiveLoadState | null> {
        const q = query(
            collection(db, COGNITIVE_LOAD_COLLECTION),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
            id: doc.id,
            userId: data.userId,
            level: data.level,
            score: data.score,
            factors: data.factors,
            timestamp: data.timestamp.toDate(),
        };
    }

    /**
     * Record an activity
     */
    static async recordActivity(activity: Omit<Activity, 'id'>): Promise<void> {
        const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
        await setDoc(activityRef, {
            ...activity,
            id: activityRef.id,
            timestamp: Timestamp.fromDate(activity.timestamp),
        });
    }

    /**
     * Get recent activities
     */
    static async getRecentActivities(userId: string, hoursAgo: number): Promise<Activity[]> {
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

        const q = query(
            collection(db, ACTIVITIES_COLLECTION),
            where('userId', '==', userId),
            where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                type: data.type,
                timestamp: data.timestamp.toDate(),
                metadata: data.metadata,
            };
        });
    }

    /**
     * Update daily stats
     */
    static async updateDailyStats(userId: string, updates: Partial<Omit<DailyStats, 'id' | 'userId' | 'date'>>): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's stats
        const q = query(
            collection(db, DAILY_STATS_COLLECTION),
            where('userId', '==', userId),
            where('date', '==', Timestamp.fromDate(today)),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Create new stats
            const statsRef = doc(collection(db, DAILY_STATS_COLLECTION));
            await setDoc(statsRef, {
                id: statsRef.id,
                userId,
                date: Timestamp.fromDate(today),
                focusTime: updates.focusTime || 0,
                contextSwitches: updates.contextSwitches || 0,
                completedTasks: updates.completedTasks || 0,
                activeThreads: updates.activeThreads || 0,
            });
        } else {
            // Update existing stats
            const statsDoc = querySnapshot.docs[0];
            const currentData = statsDoc.data();

            await setDoc(statsDoc.ref, {
                ...currentData,
                focusTime: updates.focusTime !== undefined ? updates.focusTime : currentData.focusTime,
                contextSwitches: updates.contextSwitches !== undefined ? updates.contextSwitches : currentData.contextSwitches,
                completedTasks: updates.completedTasks !== undefined ? updates.completedTasks : currentData.completedTasks,
                activeThreads: updates.activeThreads !== undefined ? updates.activeThreads : currentData.activeThreads,
            }, { merge: true });
        }
    }

    /**
     * Get daily stats for a date range
     */
    static async getDailyStats(userId: string, daysAgo: number = 7): Promise<DailyStats[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, DAILY_STATS_COLLECTION),
            where('userId', '==', userId),
            where('date', '>=', Timestamp.fromDate(startDate)),
            orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                date: data.date.toDate(),
                focusTime: data.focusTime,
                contextSwitches: data.contextSwitches,
                completedTasks: data.completedTasks,
                activeThreads: data.activeThreads,
            };
        });
    }

    /**
     * Increment context switches
     */
    static async incrementContextSwitches(userId: string): Promise<void> {
        const stats = await this.getTodayStats(userId);
        await this.updateDailyStats(userId, {
            contextSwitches: (stats?.contextSwitches || 0) + 1
        });

        // Record activity
        await this.recordActivity({
            userId,
            type: 'context-switch',
            timestamp: new Date(),
            metadata: {},
        });
    }

    /**
     * Get today's stats
     */
    private static async getTodayStats(userId: string): Promise<DailyStats | null> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, DAILY_STATS_COLLECTION),
            where('userId', '==', userId),
            where('date', '==', Timestamp.fromDate(today)),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
            id: doc.id,
            userId: data.userId,
            date: data.date.toDate(),
            focusTime: data.focusTime,
            contextSwitches: data.contextSwitches,
            completedTasks: data.completedTasks,
            activeThreads: data.activeThreads,
        };
    }
}
