import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.use(authMiddleware as any);

router.post('/:userId/google/sync', IntegrationController.syncGoogle);
router.post('/:userId/notion/sync', IntegrationController.syncNotion);

export default router;
