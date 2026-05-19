const User = require('../models/User');
const Resume = require('../models/Resume');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({ role: { $ne: 'admin' } }),
    ]);

    return sendSuccess(res, 200, 'Users fetched.', {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      totalResumes,
      totalPayments,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, subscriptionPlan: 'premium' }),
      Resume.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.find({ status: 'paid' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const revenue = totalPayments[0]?.total || 0;

    // Monthly signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $ne: 'admin' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return sendSuccess(res, 200, 'Analytics fetched.', {
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        totalResumes,
        revenueInPaise: revenue,
        revenueFormatted: `₹${(revenue / 100).toLocaleString('en-IN')}`,
      },
      monthlySignups,
      recentPayments,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PATCH /api/admin/users/:id/plan
const updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'premium'].includes(plan)) {
      return sendError(res, 400, 'Invalid plan. Must be "free" or "premium".');
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan: plan },
      { new: true }
    ).select('-password');
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User plan updated.', { user });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return sendError(res, 400, 'Cannot delete yourself.');
    }
    await User.findByIdAndDelete(req.params.id);
    await Resume.deleteMany({ userId: req.params.id });
    return sendSuccess(res, 200, 'User and all their data deleted.');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getAllUsers, getAnalytics, updateUserPlan, deleteUser };
