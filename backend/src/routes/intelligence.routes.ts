import { Router } from 'express';
import { IntelligenceController } from '../controllers/intelligence.controller';

const router = Router();

// Insights routes
router.post('/insights/:userId/generate', IntelligenceController.generateInsights);
router.get('/insights/:userId', IntelligenceController.getActiveInsights);
router.put('/insights/:id/dismiss', IntelligenceController.dismissInsight);

// Priority recommendations routes
router.post('/recommendations/:userId/generate', IntelligenceController.generateRecommendations);
router.get('/recommendations/:userId', IntelligenceController.getActiveRecommendations);

// Cognitive load routes
router.post('/cognitive-load/:userId/calculate', IntelligenceController.calculateCognitiveLoad);
router.get('/cognitive-load/:userId', IntelligenceController.getLatestCognitiveLoad);

// Analytics routes
router.get('/stats/:userId', IntelligenceController.getDailyStats);
router.put('/stats/:userId', IntelligenceController.updateDailyStats);
router.post('/context-switch/:userId', IntelligenceController.recordContextSwitch);

export default router;
