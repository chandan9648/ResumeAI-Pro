import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Crown, Check, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['2 resume uploads', 'Basic ATS score', 'Resume editor', 'PDF download'],
    cta: 'Current Plan',
    accent: 'var(--text-muted)',
  },
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: '₹499',
    period: 'per month',
    features: ['Unlimited uploads', 'AI optimization (GPT-4o)', 'Advanced ATS scoring', 'All 4 templates', 'JD matching', 'AI cover letter', 'Priority support'],
    cta: 'Upgrade Monthly',
    accent: 'var(--accent-blue)',
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: '₹3,999',
    period: 'per year',
    savings: 'Save ₹2,000',
    features: ['Everything in Monthly', '2 months free', 'Resume sharing link', 'Interview prep tips', 'LinkedIn import (soon)'],
    cta: 'Upgrade Yearly',
    accent: 'var(--accent-purple)',
    popular: true,
  },
];

export default function BillingPage() {
  const { user, updateUser } = useAuthStore();
  const { openSubscriptionModal } = useUIStore();
  const [payments, setPayments] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    paymentService.getHistory().then((res) => setPayments(res.data.data.payments || [])).catch(() => {});
  }, []);

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    setLoadingPlan(planId);
    try {
      const { data } = await paymentService.createOrder(planId);
      const { order, keyId } = data.data;

      if (order.id.startsWith('order_mock_')) {
        await paymentService.verifyPayment({
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock',
        });
        updateUser({ subscriptionPlan: 'premium' });
        toast.success('🎉 Upgraded to Premium!');
        setPayments((p) => [{ _id: Date.now(), plan: planId, amount: order.amount, status: 'paid', createdAt: new Date() }, ...p]);
      } else {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: 'INR',
          name: 'ResumeAI Pro',
          order_id: order.id,
          handler: async (response) => {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            updateUser({ subscriptionPlan: 'premium' });
            toast.success('🎉 Upgraded to Premium!');
          },
          theme: { color: '#4f8ef7' },
        };
        new window.Razorpay(options).open();
      }
    } catch (err) {
      toast.error('Payment failed. Try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const isPremium = user?.subscriptionPlan === 'premium';

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Billing & Plans</h1>
        <p className="section-subtitle">Manage your subscription and payment history</p>

        {/* Current Plan Banner */}
        <div className="glass" style={{
          padding: '20px 24px', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isPremium ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(79,142,247,0.1) 100%)' : 'rgba(255,255,255,0.03)',
          border: isPremium ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Crown size={32} color={isPremium ? 'var(--accent-purple)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {isPremium ? '⭐ Premium Plan Active' : 'Free Plan'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {isPremium ? 'You have full access to all features' : `${Math.max(0, 2 - (user?.uploadCount || 0))} free uploads remaining`}
              </div>
            </div>
          </div>
          {!isPremium && (
            <button onClick={() => openSubscriptionModal()} className="btn-primary">
              <Zap size={14} /> Upgrade Now
            </button>
          )}
        </div>

        {/* Pricing Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {plans.map((plan) => {
            const isCurrent = plan.id === 'free' ? !isPremium : isPremium;
            return (
              <div key={plan.id} style={{
                padding: '28px',
                borderRadius: '16px',
                border: plan.popular ? '2px solid rgba(139,92,246,0.4)' : '1px solid var(--border)',
                background: plan.popular ? 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(79,142,247,0.08) 100%)' : 'var(--bg-card)',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-12px', right: '20px',
                    background: 'var(--gradient-main)',
                    color: 'white', fontSize: '10px', fontWeight: 700,
                    padding: '4px 12px', borderRadius: '20px',
                  }}>BEST VALUE</div>
                )}
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: plan.accent }}>{plan.name}</div>
                <div style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>{plan.price}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: plan.savings ? '4px' : '20px' }}>{plan.period}</div>
                {plan.savings && <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '20px' }}>{plan.savings}</div>}
                <div style={{ marginBottom: '24px' }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <Check size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                  disabled={isCurrent || (isPremium && plan.id !== 'free') || loadingPlan === plan.id}
                  className={isCurrent ? 'btn-secondary' : 'btn-primary'}
                  style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                >
                  {loadingPlan === plan.id ? (
                    <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Processing...</>
                  ) : isCurrent ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment History */}
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Payment History</h2>
        {payments.length === 0 ? (
          <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CreditCard size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No payment history yet</p>
          </div>
        ) : (
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Plan', 'Amount', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px' }}>
                      {p.plan === 'yearly' ? 'Yearly Premium' : 'Monthly Premium'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px' }}>₹{((p.amount || 0) / 100).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
