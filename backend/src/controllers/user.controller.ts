import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    /**
     * Create a new user
     */
    static async createUser(req: Request, res: Response) {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user by ID
     */
    static async getUser(req: Request, res: Response) {
        try {
            const user = await UserService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(req: Request, res: Response) {
        try {
            const user = await UserService.getUserByEmail(req.query.email as string);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update user
     */
    static async updateUser(req: Request, res: Response) {
        try {
            await UserService.updateUser(req.params.id, req.body);
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(req: Request, res: Response) {
        try {
            await UserService.updatePreferences(req.params.id, req.body);
            res.json({ success: true, message: 'Preferences updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(req: Request, res: Response) {
        try {
            await UserService.deleteUser(req.params.id);
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
