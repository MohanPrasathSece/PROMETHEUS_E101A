import express from 'express';
import { TeamController } from '../controllers/team.controller';

const router = express.Router();

router.post('/', TeamController.createTeam);
router.get('/', TeamController.getMyTeams);
router.post('/join', TeamController.acceptInvite);
router.get('/:id', TeamController.getTeam);
router.post('/:id/invite', TeamController.inviteMember);
router.delete('/:id/members/:memberId', TeamController.removeMember);

export default router;
