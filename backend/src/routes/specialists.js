const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getDoctors, getDoctor, selectDoctor, unselectDoctor, getMyDoctors,
} = require('../controllers/specialistsController');

router.use(authenticate);

router.get('/', getDoctors);
router.get('/my', getMyDoctors);
router.get('/:id', getDoctor);
router.post('/:id/select', requireRole('PATIENT'), selectDoctor);
router.delete('/:id/select', requireRole('PATIENT'), unselectDoctor);

module.exports = router;
