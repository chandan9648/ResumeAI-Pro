const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/responseHandler');

let Razorpay = null;
let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    try {
      Razorpay = require('razorpay');
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id') {
        razorpayInstance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
      }
    } catch (e) {
      console.warn('Razorpay not configured.');
    }
  }
  return razorpayInstance;
};

const PLANS = {
  monthly: { amount: 49900, label: 'Monthly Premium' },  // ₹499
  yearly: { amount: 399900, label: 'Yearly Premium' },   // ₹3999
};

// POST /api/payment/create-order
const createOrder = async (req, res) => {
  try {
    const { plan = 'monthly' } = req.body;
    const planConfig = PLANS[plan] || PLANS.monthly;
    const rzp = getRazorpay();

    if (!rzp) {
      // Mock order for development
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: planConfig.amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      };

      const payment = await Payment.create({
        userId: req.user.id,
        razorpayOrderId: mockOrder.id,
        amount: planConfig.amount,
        plan,
        status: 'created',
      });

      return sendSuccess(res, 201, 'Order created (mock mode).', {
        order: mockOrder,
        payment,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
      });
    }

    const order = await rzp.orders.create({
      amount: planConfig.amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const payment = await Payment.create({
      userId: req.user.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      plan,
      status: 'created',
    });

    return sendSuccess(res, 201, 'Order created.', {
      order,
      payment,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // If mock mode — just upgrade user
    if (razorpayOrderId && razorpayOrderId.startsWith('order_mock_')) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { razorpayPaymentId, status: 'paid' }
      );
      await User.findByIdAndUpdate(req.user.id, { subscriptionPlan: 'premium' });
      return sendSuccess(res, 200, 'Payment verified. Welcome to Premium! 🎉', {
        plan: 'premium',
      });
    }

    // Verify Razorpay signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return sendError(res, 400, 'Payment verification failed. Invalid signature.');
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'paid' }
    );

    await User.findByIdAndUpdate(req.user.id, { subscriptionPlan: 'premium' });

    return sendSuccess(res, 200, 'Payment verified. Welcome to Premium! 🎉', {
      plan: 'premium',
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/payment/history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Payment history fetched.', { payments });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
