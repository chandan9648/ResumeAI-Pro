const express = require('express');
const router = express.Router();
const { analyzeJD, getAllJDs, deleteJD } = require('../controllers/jdController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllJDs);
router.post('/analyze', protect, analyzeJD);
router.delete('/:id', protect, deleteJD);

module.exports = router;
