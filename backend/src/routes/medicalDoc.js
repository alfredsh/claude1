const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadMedicalDoc, getMedicalDocs, deleteMedicalDoc, reanalyzeMedicalDoc } = require('../controllers/medicalDocController');

router.use(authenticate);
router.use(requireRole('PATIENT'));

router.post('/upload',       upload.single('file'), uploadMedicalDoc);
router.get('/',              getMedicalDocs);
router.delete('/:id',        deleteMedicalDoc);
router.post('/:id/reanalyze', reanalyzeMedicalDoc);

module.exports = router;
