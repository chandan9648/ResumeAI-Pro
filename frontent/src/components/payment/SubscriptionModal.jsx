import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, Crown } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹499',
    period: '/month',
    savings: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₹3,999',
    period: '/year',
    savings: 'Save ₹2,000',
    popular: true,
  },
];

const features = [
  'Unlimited resume uploads',
  'AI-powered optimization',
  'Premium ATS scoring',
  'All 4 resume templates',
  'JD matching insights',
  'AI cover letter generator',
  'Priority support',
];

export default function SubscriptionModal() {
  const { closeSubscriptionModal } = useUIStore();
  const { updateUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await paymentService.createOrder(selectedPlan);
      const { order, keyId } = data.data;

      // If mock mode (development), simulate success
      if (order.id.startsWith('order_mock_')) {
        await paymentService.verifyPayment({
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature',
        });
        updateUser({ subscriptionPlan: 'premium' });
        toast.success('🎉 Welcome to Premium! All features unlocked!');
        closeSubscriptionModal();
        setLoading(false);
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'ResumeAI Pro',
        description: `${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Premium Plan`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            updateUser({ subscriptionPlan: 'premium' });
            toast.success('🎉 Welcome to Premium!');
            closeSubscriptionModal();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        theme: { color: '#4f8ef7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
        onClick={(e) => e.target === e.currentTarget && closeSubscriptionModal()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'linear-gradient(135deg, #0f1629 0%, #1a1f35 100%)',
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '560px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 24px 80px rgba(79,142,247,0.2)',
          }}
        >
          {/* Close */}
          <button
            onClick={closeSubscriptionModal}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex',
            }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 16px',
              background: 'var(--gradient-main)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px',
            }}>
              <Crown size={28} color="white" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>
              Upgrade to <span className="gradient-text">Premium</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              You've used your 2 free resume uploads. Unlock unlimited access.
            </p>
          </div>

          {/* Plan Selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  flex: 1, padding: '16px', borderRadius: '12px',
                  border: `2px solid ${selectedPlan === plan.id ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: selectedPlan === plan.id ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient-main)',
                    color: 'white', fontSize: '10px', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '20px',
                    whiteSpace: 'nowrap',
                  }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{plan.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{plan.price}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{plan.period}</div>
                {plan.savings && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                    {plan.savings}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Features */}
          <div style={{ marginBottom: '28px' }}>
            {features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="var(--accent-green)" />
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', justifyContent: 'center' }}
          >
            {loading ? (
              <><div className="spinner" /> Processing...</>
            ) : (
              <><Zap size={18} /> Get Premium — {selectedPlan === 'yearly' ? '₹3,999/yr' : '₹499/mo'}</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Secure payment · Cancel anytime · Instant access
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
