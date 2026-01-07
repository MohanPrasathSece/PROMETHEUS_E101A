import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, UserPreferences } from '../types';
import { UserModel } from '../models/User';
import { WorkThreadModel } from '../models/WorkThread';
import { WorkItemModel } from '../models/WorkItem';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '636666241864-fronahev0ijj9vr0a0lue6lhuunqnp87.apps.googleusercontent.com');

export class UserService {
    /**
     * Register a new user
     */
    static async register(userData: any): Promise<{ user: User, token: string }> {
        try {
            const { name, email, password } = userData;

            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = new UserModel({
                name,
                email,
                password: hashedPassword,
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
            await this.seedInitialData(newUser.id);

            const userJson = newUser.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error registering user:', error.message);
            throw error;
        }
    }

    /**
     * Login user
     */
    static async login(credentials: any): Promise<{ user: User, token: string }> {
        try {
            const { email, password } = credentials;

            const user = await UserModel.findOne({ email });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(password, user.password as string);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            user.lastLogin = new Date();
            await user.save();

            const userJson = user.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error logging in:', error.message);
            throw error;
        }
    }

    /**
     * Google Login
     */
    static async googleLogin(idToken: string): Promise<{ user: User, token: string }> {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID || '636666241864-fronahev0ijj9vr0a0lue6lhuunqnp87.apps.googleusercontent.com',
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error('Invalid Google token');
            }

            const { email, name, picture } = payload;

            let user = await UserModel.findOne({ email });

            if (!user) {
                // Create new user if doesn't exist
                user = new UserModel({
                    name: name || 'Google User',
                    email,
                    avatar: picture,
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
                await user.save();
                await this.seedInitialData(user.id);
            } else {
                user.lastLogin = new Date();
                if (picture) user.avatar = picture;
                await user.save();
            }

            const userJson = user.toJSON() as unknown as User;
            const token = this.generateToken(userJson.id);

            return { user: userJson, token };
        } catch (error: any) {
            console.error('Error with Google Login:', error.message);
            throw error;
        }
    }

    private static generateToken(userId: string): string {
        const secret = process.env.JWT_SECRET || 'your-default-jwt-secret';
        return jwt.sign({ id: userId }, secret, { expiresIn: '30d' });
    }

    /**
     * Create a new user (Legacy/Fallback)
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
