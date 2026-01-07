import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';

export class TeamController {

    static async createTeam(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { name, description } = req.body;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const team = await TeamService.createTeam(userId, name, description);
            res.status(201).json({ success: true, data: team });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getMyTeams(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const teams = await TeamService.getMyTeams(userId);
            res.json({ success: true, data: teams });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getTeam(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const teamId = req.params.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const team = await TeamService.getTeam(teamId, userId);
            res.json({ success: true, data: team });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async inviteMember(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const teamId = req.params.id;
            const { email } = req.body;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const result = await TeamService.inviteMember(teamId, userId, email);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async acceptInvite(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { token } = req.body;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const team = await TeamService.acceptInvite(userId, token);
            res.json({ success: true, data: team });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async removeMember(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const teamId = req.params.id;
            const memberId = req.params.memberId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const team = await TeamService.removeMember(teamId, userId, memberId);
            res.json({ success: true, data: team });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
