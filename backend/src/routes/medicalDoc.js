const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadMedicalDoc, getMedicalDocs, deleteMedicalDoc } = require('../controllers/medicalDocController');

router.use(authenticate);
router.use(requireRole('PATIENT'));

router.post('/upload', upload.single('file'), uploadMedicalDoc);
router.get('/',        getMedicalDocs);
router.delete('/:id',  deleteMedicalDoc);

module.exports = router;
