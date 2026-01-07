import { Request, Response } from 'express';
import { WorkThreadService } from '../services/thread.service';

export class ThreadController {
    /**
     * Create a new thread
     */
    static async createThread(req: Request, res: Response) {
        try {
            const thread = await WorkThreadService.createThread(req.body);
            res.status(201).json({ success: true, data: thread });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get thread by ID
     */
    static async getThread(req: Request, res: Response) {
        try {
            const thread = await WorkThreadService.getThreadById(req.params.id);
            if (!thread) {
                return res.status(404).json({ success: false, error: 'Thread not found' });
            }
            res.json({ success: true, data: thread });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get all threads for a user
     */
    static async getUserThreads(req: Request, res: Response) {
        try {
            const threads = await WorkThreadService.getUserThreads(req.params.userId);
            res.json({ success: true, data: threads });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get active threads
     */
    static async getActiveThreads(req: Request, res: Response) {
        try {
            const threads = await WorkThreadService.getActiveThreads(req.params.userId);
            res.json({ success: true, data: threads });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get high priority threads
     */
    static async getHighPriorityThreads(req: Request, res: Response) {
        try {
            const threads = await WorkThreadService.getHighPriorityThreads(req.params.userId);
            res.json({ success: true, data: threads });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update thread
     */
    static async updateThread(req: Request, res: Response) {
        try {
            await WorkThreadService.updateThread(req.params.id, req.body);
            res.json({ success: true, message: 'Thread updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update thread progress
     */
    static async updateProgress(req: Request, res: Response) {
        try {
            await WorkThreadService.updateProgress(req.params.id, req.body.progress);
            res.json({ success: true, message: 'Progress updated successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Toggle ignore thread
     */
    static async toggleIgnore(req: Request, res: Response) {
        try {
            await WorkThreadService.toggleIgnoreThread(req.params.id, req.body.isIgnored);
            res.json({ success: true, message: 'Thread ignore status updated' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete thread
     */
    static async deleteThread(req: Request, res: Response) {
        try {
            await WorkThreadService.deleteThread(req.params.id);
            res.json({ success: true, message: 'Thread deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get threads with upcoming deadlines
     */
    static async getUpcomingDeadlines(req: Request, res: Response) {
        try {
            const daysAhead = parseInt(req.query.days as string) || 7;
            const threads = await WorkThreadService.getThreadsWithUpcomingDeadlines(req.params.userId, daysAhead);
            res.json({ success: true, data: threads });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
