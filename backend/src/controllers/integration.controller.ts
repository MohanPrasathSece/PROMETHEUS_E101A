import { Request, Response } from 'express';
import { IntegrationService } from '../services/integration.service';

export class IntegrationController {

    /**
     * Sync Google Calendar & Tasks
     */
    static async syncGoogle(req: Request, res: Response) {
        try {
            const { accessToken } = req.body;
            // Assuming authMiddleware adds userId to req.user or similar, 
            // but the legacy middleware might just put it on req.body or verify generic token.
            // Let's assume we pull userId from the authenticated user token.
            // Wait, looking at other controllers (e.g., IntelligenceController), 
            // the pattern is to pass userId in params OR assume it's attached.
            // UserRoutes uses authMiddleware.
            // Let's check how we get userId usually.
            // Looking at user.controller.ts, it uses req.params.id for updates.
            // But for a sync action initiated by the logged in user...

            // I will assume the route will include :userId or I will grab it from req.body if the frontend sends it.
            // Better pattern: Frontend sends userId in URL: /api/integrations/:userId/google/sync

            const userId = req.params.userId;
            const result = await IntegrationService.syncGoogle(userId, accessToken);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Sync Notion
     */
    static async syncNotion(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const { apiKey } = req.body;
            const result = await IntegrationService.syncNotion(userId, apiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
