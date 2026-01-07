import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { WorkThread } from '../types';

const THREADS_COLLECTION = 'workThreads';

export class WorkThreadService {
    /**
     * Create a new work thread
     */
    static async createThread(thread: Omit<WorkThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkThread> {
        const threadRef = doc(collection(db, THREADS_COLLECTION));
        const now = new Date();
        const newThread: WorkThread = {
            ...thread,
            id: threadRef.id,
            createdAt: now,
            updatedAt: now,
        };

        try {
            await setDoc(threadRef, {
                ...newThread,
                lastActivity: Timestamp.fromDate(newThread.lastActivity),
                deadline: newThread.deadline ? Timestamp.fromDate(newThread.deadline) : null,
                createdAt: Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
            });
        } catch (error: any) {
            console.error('Error creating thread in Firestore:', error);
            if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
                console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Cloud Firestore API is disabled. Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview');
            }
            throw error;
        }

        return newThread;
    }

    /**
     * Get thread by ID
     */
    static async getThreadById(threadId: string): Promise<WorkThread | null> {
        try {
            const threadDoc = await getDoc(doc(db, THREADS_COLLECTION, threadId));

            if (!threadDoc.exists()) {
                return null;
            }

            return this.mapDocToThread(threadDoc);
        } catch (error: any) {
            console.error(`Error getting thread ${threadId}:`, error);
            if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
                console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Cloud Firestore API is disabled. Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview');
            }
            throw error;
        }
    }

    /**
     * Get all threads for a user
     */
    static async getUserThreads(userId: string): Promise<WorkThread[]> {
        try {
            const q = query(
                collection(db, THREADS_COLLECTION),
                where('userId', '==', userId),
                orderBy('lastActivity', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToThread(doc));
        } catch (error: any) {
            console.error('Error getting user threads:', error);
            if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
                console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Cloud Firestore API is disabled. Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview');
            }
            throw error;
        }
    }

    /**
     * Get active threads (not ignored)
     */
    static async getActiveThreads(userId: string): Promise<WorkThread[]> {
        try {
            const q = query(
                collection(db, THREADS_COLLECTION),
                where('userId', '==', userId),
                where('isIgnored', '==', false),
                orderBy('lastActivity', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToThread(doc));
        } catch (error: any) {
            console.error('Error getting active threads:', error);
            throw error;
        }
    }

    /**
     * Get high priority threads
     */
    static async getHighPriorityThreads(userId: string): Promise<WorkThread[]> {
        try {
            const q = query(
                collection(db, THREADS_COLLECTION),
                where('userId', '==', userId),
                where('priority', '==', 'high'),
                orderBy('lastActivity', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToThread(doc));
        } catch (error: any) {
            console.error('Error getting high priority threads:', error);
            throw error;
        }
    }

    /**
     * Update thread
     */
    static async updateThread(threadId: string, updates: Partial<WorkThread>): Promise<void> {
        const threadRef = doc(db, THREADS_COLLECTION, threadId);
        const updateData: any = { ...updates };

        // Convert Date objects to Timestamps
        if (updates.lastActivity) {
            updateData.lastActivity = Timestamp.fromDate(updates.lastActivity);
        }
        if (updates.deadline) {
            updateData.deadline = Timestamp.fromDate(updates.deadline);
        }
        updateData.updatedAt = Timestamp.fromDate(new Date());

        await updateDoc(threadRef, updateData);
    }

    /**
     * Update thread progress
     */
    static async updateProgress(threadId: string, progress: number): Promise<void> {
        const threadRef = doc(db, THREADS_COLLECTION, threadId);
        await updateDoc(threadRef, {
            progress,
            updatedAt: Timestamp.fromDate(new Date()),
        });
    }

    /**
     * Ignore/Un-ignore thread
     */
    static async toggleIgnoreThread(threadId: string, isIgnored: boolean): Promise<void> {
        const threadRef = doc(db, THREADS_COLLECTION, threadId);
        await updateDoc(threadRef, {
            isIgnored,
            updatedAt: Timestamp.fromDate(new Date()),
        });
    }

    /**
     * Delete thread
     */
    static async deleteThread(threadId: string): Promise<void> {
        await deleteDoc(doc(db, THREADS_COLLECTION, threadId));
    }

    /**
     * Get threads with upcoming deadlines
     */
    static async getThreadsWithUpcomingDeadlines(userId: string, daysAhead: number = 7): Promise<WorkThread[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const q = query(
            collection(db, THREADS_COLLECTION),
            where('userId', '==', userId),
            where('deadline', '<=', Timestamp.fromDate(futureDate)),
            orderBy('deadline', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocToThread(doc));
    }

    /**
     * Helper to map Firestore document to WorkThread
     */
    private static mapDocToThread(doc: any): WorkThread {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            title: data.title,
            description: data.description,
            itemIds: data.itemIds || [],
            priority: data.priority,
            deadline: data.deadline?.toDate(),
            lastActivity: data.lastActivity.toDate(),
            progress: data.progress,
            isIgnored: data.isIgnored || false,
            relatedPeople: data.relatedPeople || [],
            tags: data.tags || [],
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        };
    }
}
