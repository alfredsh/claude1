const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  chat, getChatSessions, getChatSession, generateRecommendations, getAISettings,
  generateSupplementRecommendations,
} = require('../controllers/aiController');

router.use(authenticate);

router.post('/chat', chat);
router.get('/chat/sessions', getChatSessions);
router.get('/chat/sessions/:id', getChatSession);
router.post('/recommendations/generate',   generateRecommendations);
router.post('/supplements/recommend',      generateSupplementRecommendations);
router.get('/settings', getAISettings);

module.exports = router;
