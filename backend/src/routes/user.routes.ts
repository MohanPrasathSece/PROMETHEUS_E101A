import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

// User routes
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUser);
router.get('/email/search', UserController.getUserByEmail);
router.put('/:id', UserController.updateUser);
router.put('/:id/preferences', UserController.updatePreferences);
router.delete('/:id', UserController.deleteUser);

export default router;
