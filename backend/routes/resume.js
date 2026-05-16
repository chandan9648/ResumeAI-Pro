const express = require('express');
const router = express.Router();
const {
  uploadResume,
  optimizeResumeById,
  getAllResumes,
  getResumeById,
  updateResume,
  duplicateResume,
  deleteResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllResumes);
router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/optimize', protect, optimizeResumeById);
router.get('/:id', protect, getResumeById);
router.put('/:id', protect, updateResume);
router.post('/:id/duplicate', protect, duplicateResume);
router.delete('/:id', protect, deleteResume);

module.exports = router;
