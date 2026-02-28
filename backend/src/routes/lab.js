const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLabResult, getLabResults, getLabResult, deleteLabResult } = require('../controllers/labController');

router.use(authenticate);
router.use(requireRole('PATIENT'));

router.post('/upload', upload.single('file'), uploadLabResult);
router.get('/', getLabResults);
router.get('/:id', getLabResult);
router.delete('/:id', deleteLabResult);

module.exports = router;
