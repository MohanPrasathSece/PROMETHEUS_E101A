import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { WorkItem } from '../types';

const ITEMS_COLLECTION = 'workItems';

export class WorkItemService {
    /**
     * Create a new work item
     */
    static async createItem(item: Omit<WorkItem, 'id'>): Promise<WorkItem> {
        const itemRef = doc(collection(db, ITEMS_COLLECTION));
        const newItem: WorkItem = {
            ...item,
            id: itemRef.id,
        };

        try {
            await setDoc(itemRef, {
                ...newItem,
                timestamp: Timestamp.fromDate(newItem.timestamp),
            });
        } catch (error: any) {
            console.error('Error creating work item in Firestore:', error);
            if (error.code === 'permission-denied' || error.message?.includes('PERMISSION_DENIED')) {
                console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Cloud Firestore API is disabled. Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview');
            }
            throw error;
        }

        return newItem;
    }

    /**
     * Get item by ID
     */
    static async getItemById(itemId: string): Promise<WorkItem | null> {
        try {
            const itemDoc = await getDoc(doc(db, ITEMS_COLLECTION, itemId));

            if (!itemDoc.exists()) {
                return null;
            }

            return this.mapDocToItem(itemDoc);
        } catch (error: any) {
            console.error(`Error getting work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Get all items for a user
     */
    static async getUserItems(userId: string): Promise<WorkItem[]> {
        try {
            const q = query(
                collection(db, ITEMS_COLLECTION),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToItem(doc));
        } catch (error: any) {
            console.error('Error getting user items:', error);
            if (error.code === 'permission-denied' || error.message?.includes('PERMISSION_DENIED')) {
                console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Cloud Firestore API is disabled. Enable it here: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview');
            }
            throw error;
        }
    }

    /**
     * Get items by type
     */
    static async getItemsByType(userId: string, type: string): Promise<WorkItem[]> {
        try {
            const q = query(
                collection(db, ITEMS_COLLECTION),
                where('userId', '==', userId),
                where('type', '==', type),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToItem(doc));
        } catch (error: any) {
            console.error(`Error getting items of type ${type} for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get items for a thread
     */
    static async getThreadItems(threadId: string): Promise<WorkItem[]> {
        try {
            const q = query(
                collection(db, ITEMS_COLLECTION),
                where('threadId', '==', threadId),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToItem(doc));
        } catch (error: any) {
            console.error(`Error getting items for thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Get unread items
     */
    static async getUnreadItems(userId: string): Promise<WorkItem[]> {
        try {
            const q = query(
                collection(db, ITEMS_COLLECTION),
                where('userId', '==', userId),
                where('isRead', '==', false),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocToItem(doc));
        } catch (error: any) {
            console.error('Error getting unread items:', error);
            throw error;
        }
    }

    /**
     * Mark item as read
     */
    static async markAsRead(itemId: string): Promise<void> {
        try {
            const itemRef = doc(db, ITEMS_COLLECTION, itemId);
            await updateDoc(itemRef, { isRead: true });
        } catch (error: any) {
            console.error(`Error marking item ${itemId} as read:`, error);
            throw error;
        }
    }

    /**
     * Update item
     */
    static async updateItem(itemId: string, updates: Partial<WorkItem>): Promise<void> {
        try {
            const itemRef = doc(db, ITEMS_COLLECTION, itemId);
            const updateData: any = { ...updates };

            if (updates.timestamp) {
                updateData.timestamp = Timestamp.fromDate(updates.timestamp);
            }

            await updateDoc(itemRef, updateData);
        } catch (error: any) {
            console.error(`Error updating work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Delete item
     */
    static async deleteItem(itemId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
        } catch (error: any) {
            console.error(`Error deleting work item ${itemId}:`, error);
            throw error;
        }
    }

    /**
     * Assign item to thread
     */
    static async assignToThread(itemId: string, threadId: string): Promise<void> {
        try {
            const itemRef = doc(db, ITEMS_COLLECTION, itemId);
            await updateDoc(itemRef, { threadId });
        } catch (error: any) {
            console.error(`Error assigning item ${itemId} to thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Helper to map Firestore document to WorkItem
     */
    private static mapDocToItem(doc: any): WorkItem {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            source: data.source,
            timestamp: data.timestamp.toDate(),
            preview: data.preview,
            isRead: data.isRead || false,
            threadId: data.threadId,
            metadata: data.metadata,
        };
    }
}
