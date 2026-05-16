const express = require('express');
const router = express.Router();
const { getAllUsers, getAnalytics, updateUserPlan, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.get('/analytics', getAnalytics);
router.patch('/users/:id/plan', updateUserPlan);
router.delete('/users/:id', deleteUser);

module.exports = router;
