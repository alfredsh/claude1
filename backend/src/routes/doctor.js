const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getPatients, getPatient, addPrescription, addDoctorRecommendation,
  analyzePatientAI, getDoctorProfile,
} = require('../controllers/doctorController');

router.use(authenticate);
router.use(requireRole('DOCTOR', 'ADMIN'));

router.get('/profile', getDoctorProfile);
router.get('/patients', getPatients);
router.get('/patients/:id', getPatient);
router.post('/prescriptions', addPrescription);
router.post('/recommendations', addDoctorRecommendation);
router.post('/patients/:id/analyze', analyzePatientAI);

module.exports = router;
