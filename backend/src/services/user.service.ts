import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserPreferences } from '../types';

const USERS_COLLECTION = 'users';

export class UserService {
    /**
     * Create a new user
     */
    static async createUser(user: Partial<User> & { id: string }): Promise<User> {
        const userRef = doc(db, USERS_COLLECTION, user.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            await updateDoc(userRef, {
                lastLogin: Timestamp.fromDate(new Date()),
            });
            const data = userDoc.data() as any;
            return {
                id: userDoc.id,
                name: data.name,
                email: data.email,
                avatar: data.avatar,
                createdAt: data.createdAt.toDate(),
                lastLogin: new Date(),
                preferences: data.preferences,
            };
        }

        const newUser: User = {
            id: user.id,
            name: user.name || 'Unknown User',
            email: user.email || '',
            avatar: user.avatar,
            createdAt: new Date(),
            lastLogin: new Date(),
            preferences: {
                theme: 'auto',
                notificationsEnabled: true,
                workHoursStart: 9,
                workHoursEnd: 17,
                focusTimeGoal: 120
            },
        };

        try {
            await setDoc(userRef, {
                ...newUser,
                createdAt: Timestamp.fromDate(newUser.createdAt),
                lastLogin: Timestamp.fromDate(newUser.lastLogin!),
            });

            // Seed initial data for new users
            await this.seedInitialData(newUser.id);
        } catch (error: any) {
            console.error('Error creating/seeding user in Firestore (falling back to local user object):', error.message);
            if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
                console.error('CRITICAL: Firestore Cloud API is not enabled. Please enable it in Google Cloud Console.');
            }
        }

        return newUser;
    }

    private static async seedInitialData(userId: string) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        // Seed Threads
        const threadsData = [
            {
                userId,
                title: 'Q4 Strategic Planning',
                description: 'Finalizing budget and objectives for Q4',
                priority: 'high',
                progress: 35,
                lastActivity: now,
                deadline: new Date(now.getFullYear(), now.getMonth() + 1, 15),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['Sarah Chen', 'Mike Ross'],
                tags: ['Strategy', 'Finance']
            },
            {
                userId,
                title: 'Product Launch: Horizon v2',
                description: 'Coordination for upcoming major release',
                priority: 'high',
                progress: 75,
                lastActivity: yesterday,
                deadline: new Date(now.getFullYear(), now.getMonth(), 28),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['Dev Team', 'Marketing'],
                tags: ['Product', 'Launch']
            },
            {
                userId,
                title: 'Team Performance Reviews',
                description: 'Annual performance evaluation cycle',
                priority: 'medium',
                progress: 10,
                lastActivity: new Date(now.getTime() - 86400000 * 3), // 3 days ago
                deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
                isIgnored: false,
                itemIds: [],
                relatedPeople: ['HR'],
                tags: ['HR', 'Management']
            }
        ];

        for (const threadData of threadsData) {
            const threadRef = doc(collection(db, 'workThreads'));
            await setDoc(threadRef, {
                ...threadData,
                id: threadRef.id,
                createdAt: Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
                lastActivity: Timestamp.fromDate(threadData.lastActivity as Date),
                deadline: threadData.deadline ? Timestamp.fromDate(threadData.deadline as Date) : null
            });

            // Seed items for this thread
            if (threadData.title === 'Q4 Strategic Planning') {
                const itemRef = doc(collection(db, 'workItems'));
                await setDoc(itemRef, {
                    id: itemRef.id,
                    userId,
                    threadId: threadRef.id,
                    type: 'email',
                    title: 'Budget Approval Request',
                    content: 'Hi Team, please review the attached budget proposal for Q4.',
                    source: 'Gmail',
                    url: 'https://mail.google.com',
                    isRead: false,
                    receivedAt: Timestamp.fromDate(now),
                    priority: 'high',
                    createdAt: Timestamp.fromDate(now)
                });
            }
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));

        if (!userDoc.exists()) {
            return null;
        }

        const data = userDoc.data() as any;
        return {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            createdAt: data.createdAt.toDate(),
            lastLogin: data.lastLogin?.toDate(),
            preferences: data.preferences,
        };
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data() as any;
        return {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            createdAt: data.createdAt.toDate(),
            lastLogin: data.lastLogin?.toDate(),
            preferences: data.preferences,
        };
    }

    /**
     * Update user
     */
    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const updateData: any = { ...updates };

        // Convert Date objects to Timestamps
        if (updates.lastLogin) {
            updateData.lastLogin = Timestamp.fromDate(updates.lastLogin);
        }

        await updateDoc(userRef, updateData);
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { preferences });
    }

    /**
     * Delete user
     */
    static async deleteUser(userId: string): Promise<void> {
        await deleteDoc(doc(db, USERS_COLLECTION, userId));
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId: string): Promise<void> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            lastLogin: Timestamp.fromDate(new Date()),
        });
    }
}
