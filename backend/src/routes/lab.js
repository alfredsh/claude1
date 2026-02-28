const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLabResult, getLabResults, getLabResult } = require('../controllers/labController');

router.use(authenticate);
router.use(requireRole('PATIENT'));

router.post('/upload', upload.single('file'), uploadLabResult);
router.get('/', getLabResults);
router.get('/:id', getLabResult);

module.exports = router;
