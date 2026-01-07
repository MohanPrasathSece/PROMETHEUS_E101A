import { User, UserPreferences } from '../types';
import { UserModel } from '../models/User';
import { WorkThreadModel } from '../models/WorkThread';
import { WorkItemModel } from '../models/WorkItem';

export class UserService {
    /**
     * Create a new user
     */
    static async createUser(user: Partial<User> & { id: string }): Promise<User> {
        try {
            let existingUser = await UserModel.findOne({ $or: [{ _id: user.id }, { email: user.email }] });

            if (existingUser) {
                existingUser.lastLogin = new Date();
                await existingUser.save();
                return existingUser.toJSON() as unknown as User;
            }

            const newUser = new UserModel({
                _id: user.id,
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
            });

            await newUser.save();

            // Seed initial data for new users
            await this.seedInitialData(user.id);

            return newUser.toJSON() as unknown as User;
        } catch (error: any) {
            console.error('Error creating user in MongoDB:', error.message);
            throw error;
        }
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
            const newThread = new WorkThreadModel({
                ...threadData,
                createdAt: now,
                updatedAt: now,
            });
            await newThread.save();

            // Seed items for this thread
            if (threadData.title === 'Q4 Strategic Planning') {
                const newItem = new WorkItemModel({
                    userId,
                    threadId: newThread.id,
                    type: 'email',
                    title: 'Budget Approval Request',
                    source: 'Gmail',
                    preview: 'Hi Team, please review the attached budget proposal for Q4.',
                    isRead: false,
                    timestamp: now,
                    metadata: {
                        url: 'https://mail.google.com',
                        priority: 'high'
                    }
                });
                await newItem.save();
            }
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        const user = await UserModel.findById(userId);
        return user ? (user.toJSON() as unknown as User) : null;
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        return user ? (user.toJSON() as unknown as User) : null;
    }

    /**
     * Update user
     */
    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            ...updates,
            updatedAt: new Date()
        });
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, { preferences });
    }

    /**
     * Delete user
     */
    static async deleteUser(userId: string): Promise<void> {
        await UserModel.findByIdAndDelete(userId);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId: string): Promise<void> {
        await UserModel.findByIdAndUpdate(userId, {
            lastLogin: new Date()
        });
    }
}
