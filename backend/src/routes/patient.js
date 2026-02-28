const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getProfile, updateProfile, addHealthMetric, getHealthMetrics,
  getSupplements, getRecommendations, addNutritionLog, getNutritionLogs,
} = require('../controllers/patientController');

router.use(authenticate);
router.use(requireRole('PATIENT'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/metrics', addHealthMetric);
router.get('/metrics', getHealthMetrics);
router.get('/supplements', getSupplements);
router.get('/recommendations', getRecommendations);
router.post('/nutrition', addNutritionLog);
router.get('/nutrition', getNutritionLogs);

module.exports = router;
